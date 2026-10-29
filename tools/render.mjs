#!/usr/bin/env node
/**
 * frame-forge render — deterministic HTML composition → video.
 *
 *   node tools/render.mjs <projectDir> [options]
 *
 * Options:
 *   --out, -o <file>     output path (default <project>/renders/<name>-<timestamp>.mp4)
 *   --fps <24|30|60>     frame rate (default 30)
 *   --quality <tier>     draft | standard | high (default standard)
 *   --format <fmt>       mp4 | webm | mov | gif | png-sequence
 *   --workers <n|auto>   capture workers (default auto)
 *   --crf <0-51>         encoder quality knob
 *   --engine <path>      render engine CLI (default: resolve from node_modules)
 *   --ffmpeg <path>      ffmpeg binary (exported as HYPERFRAMES_FFMPEG_PATH)
 *   --browser <path>     chromium binary for capture
 *   --dry-run            print the resolved command and exit
 *
 * The engine is a normal dependency; this file contains no engine code.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

function fail(message, code = 1) {
  console.error(`error: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { positional: [] };
  const takesValue = new Set([
    "--out", "-o", "--fps", "--quality", "--format", "--workers",
    "--crf", "--engine", "--ffmpeg", "--browser", "--resolution",
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (takesValue.has(arg)) {
      const value = argv[i + 1];
      if (value === undefined) fail(`${arg} needs a value`);
      opts[arg.replace(/^-+/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      i += 1;
    } else if (arg.startsWith("-")) {
      fail(`unknown option ${arg}`);
    } else {
      opts.positional.push(arg);
    }
  }
  return opts;
}

/** Resolve the engine CLI without vendoring it. */
function resolveEngine(explicit) {
  const candidates = [];
  if (explicit) candidates.push({ kind: "flag", path: explicit });

  const env = process.env.FRAMEFORGE_ENGINE;
  if (env) candidates.push({ kind: "env", path: env });

  candidates.push(
    { kind: "dependency", path: join(ROOT, "node_modules", "hyperframes", "bin", "hyperframes.mjs") },
    { kind: "dependency", path: join(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs") },
  );

  const binDir = join(ROOT, "node_modules", ".bin");
  if (existsSync(binDir)) {
    for (const entry of readdirSync(binDir)) {
      if (entry === "hyperframes" || entry === "hyperframes.cmd") {
        candidates.push({ kind: "dependency", path: join(binDir, entry) });
      }
    }
  }

  // Optional convenience: reuse an engine already shipped by another local app.
  // Opt-in only, so the default install stays reproducible from package.json.
  if (process.env.FRAMEFORGE_ENGINE_BUNDLED) {
    const bundled = process.env.FRAMEFORGE_ENGINE_BUNDLED;
    candidates.push({ kind: "bundled", path: bundled });
  }

  for (const candidate of candidates) {
    if (candidate.path && existsSync(candidate.path)) return candidate;
  }
  return null;
}

function buildArgs(enginePath, projectDir, opts, outPath) {
  const args = [];
  const isScript = enginePath.endsWith(".mjs") || enginePath.endsWith(".js");
  const cli = isScript ? [enginePath] : [];
  const cmdArgs = [
    ...cli,
    "render",
    projectDir,
    "--output",
    outPath,
  ];
  if (opts.fps) cmdArgs.push("--fps", String(opts.fps));
  if (opts.quality) cmdArgs.push("--quality", String(opts.quality));
  if (opts.format) cmdArgs.push("--format", String(opts.format));
  if (opts.workers) cmdArgs.push("--workers", String(opts.workers));
  if (opts.crf) cmdArgs.push("--crf", String(opts.crf));
  if (opts.resolution) cmdArgs.push("--resolution", String(opts.resolution));
  if (opts.browser) cmdArgs.push("--browser-path", String(opts.browser));
  return { command: process.execPath, args: cmdArgs, isScript };
}

function probe(outPath) {
  return new Promise((resolveProbe) => {
    const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
    const child = spawn(ffprobe, [
      "-v", "error",
      "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames",
      "-show_entries", "format=duration,size",
      "-of", "json",
      outPath,
    ], { stdio: ["ignore", "pipe", "ignore"] });
    let buffer = "";
    child.stdout.on("data", (chunk) => { buffer += chunk.toString("utf8"); });
    child.once("error", () => resolveProbe(null));
    child.once("close", (code) => {
      if (code !== 0) return resolveProbe(null);
      try {
        const parsed = JSON.parse(buffer);
        const stream = (parsed.streams || [])[0] || {};
        const format = parsed.format || {};
        resolveProbe({
          codec: stream.codec_name ?? null,
          width: stream.width ?? null,
          height: stream.height ?? null,
          frameRate: stream.r_frame_rate ?? null,
          frames: stream.nb_frames ? Number(stream.nb_frames) : null,
          durationSeconds: format.duration ? Number(format.duration) : null,
          bytes: format.size ? Number(format.size) : statSync(outPath, { throwIfNoEntry: false })?.size ?? null,
        });
      } catch {
        resolveProbe(null);
      }
    });
  });
}

function defaultOut(projectDir, format) {
  const name = basename(resolve(projectDir));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return join(resolve(projectDir), "renders", `${name}_${stamp}.${format || "mp4"}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("usage: node tools/render.mjs <projectDir> [--out f.mp4] [--fps 30] [--quality draft|standard|high] [--dry-run]");
    return;
  }
  const projectDir = resolve(opts.positional[0] || process.cwd());
  if (!existsSync(projectDir)) fail(`project directory not found: ${projectDir}`);
  if (!existsSync(join(projectDir, "index.html"))) {
    fail(`no index.html in ${projectDir} — run tools/scaffold.mjs first`);
  }

  const engine = resolveEngine(opts.engine);
  if (!engine) {
    fail(
      "no render engine found. Install one with `npm i -D hyperframes`,\n" +
      "       or pass --engine <cli.mjs>, or set FRAMEFORGE_ENGINE.",
    );
  }

  if (opts.ffmpeg) process.env.HYPERFRAMES_FFMPEG_PATH = opts.ffmpeg;
  if (opts.browser) process.env.PRODUCER_HEADLESS_SHELL_PATH = opts.browser;

  const outPath = resolve(opts.out || defaultOut(projectDir, opts.format));
  mkdirSync(dirname(outPath), { recursive: true });
  const { command, args } = buildArgs(engine.path, projectDir, opts, outPath);

  if (opts.dryRun) {
    console.log(JSON.stringify({
      engine: engine.path,
      engineSource: engine.kind,
      command,
      args,
      output: outPath,
    }, null, 2));
    return;
  }

  const started = Date.now();
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FRAMEFORGE_ACTIVE: "1" },
  });

  let stderrTail = "";
  let frames = 0;
  const strip = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

  const handle = (chunk, isErr) => {
    const text = strip(chunk.toString("utf8"));
    if (isErr) {
      stderrTail = (stderrTail + text).slice(-4000);
    }
    for (const line of text.split(/[\r\n]+/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = /frame\s+(\d+)\s*\/\s*(\d+)/i.exec(trimmed);
      if (match) frames = Math.max(frames, Number(match[1]));
      if (process.env.FRAMEFORGE_VERBOSE || !match) {
        process.stderr.write(`[engine] ${trimmed}\n`);
      }
    }
  };
  child.stdout.on("data", (chunk) => handle(chunk, false));
  child.stderr.on("data", (chunk) => handle(chunk, true));

  const code = await new Promise((resolveExit) => {
    child.once("error", (error) => {
      console.error(`error: could not start engine: ${error.message}`);
      resolveExit(-1);
    });
    child.once("close", resolveExit);
  });

  const elapsedMs = Date.now() - started;
  if (code !== 0) {
    console.error(stderrTail.trim());
    fail(`engine exited ${code} after ${elapsedMs} ms`, 2);
  }
  if (!existsSync(outPath)) fail("engine reported success but produced no output file");

  const size = statSync(outPath).size;
  if (size <= 32) fail(`output is too small to be a video (${size} bytes)`);
  const meta = await probe(outPath);

  console.log(JSON.stringify({
    ok: true,
    output: outPath,
    bytes: size,
    elapsedMs,
    engine: engine.path,
    engineSource: engine.kind,
    framesCaptured: frames || null,
    video: meta,
  }, null, 2));
}

main().catch((error) => fail(error?.stack || String(error)));
