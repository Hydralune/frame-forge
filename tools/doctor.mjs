#!/usr/bin/env node
/**
 * frame-forge doctor — verify the toolchain the render pipeline needs.
 *
 *   node tools/doctor.mjs [--json]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const json = process.argv.includes("--json");

const checks = [];
function add(name, ok, detail, hint) {
  checks.push({ name, ok, detail, hint });
}

function which(binary) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [binary], {
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf8",
  });
  if (probe.status !== 0) return null;
  return probe.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] ?? null;
}

function version(binary, args) {
  const probe = spawnSync(binary, args, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" });
  if (probe.status !== 0) return null;
  return (probe.stdout || "").split(/\r?\n/)[0].trim();
}

// 1. node
const major = Number(process.versions.node.split(".")[0]);
add(
  "node",
  major >= 22,
  `v${process.versions.node} (${process.platform} ${process.arch})`,
  "the engine requires Node >= 22",
);

// 2. engine
const engineCandidates = [
  process.env.FRAMEFORGE_ENGINE,
  join(ROOT, "node_modules", "hyperframes", "bin", "hyperframes.mjs"),
  join(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs"),
  process.env.FRAMEFORGE_ENGINE_BUNDLED,
].filter(Boolean);
const engine = engineCandidates.find((candidate) => existsSync(candidate));
add(
  "engine",
  Boolean(engine),
  engine ?? "not found",
  "npm i -D hyperframes   (or pass --engine / set FRAMEFORGE_ENGINE)",
);

// 3. chromium
const chromeCandidates = [
  process.env.PRODUCER_HEADLESS_SHELL_PATH,
  process.env.HYPERFRAMES_BROWSER_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const cacheRoot = join(process.env.HOME || process.env.USERPROFILE || "", ".cache", "puppeteer", "chrome-headless-shell");
if (existsSync(cacheRoot)) {
  for (const entry of readdirSync(cacheRoot)) {
    const platform = process.platform === "win32" ? "win64" : process.platform === "darwin" ? "mac-arm64" : "linux64";
    chromeCandidates.push(join(cacheRoot, entry, `${platform === "win64" ? "chrome-headless-shell-win64" : platform === "mac-arm64" ? "chrome-headless-shell-mac-arm64" : "chrome-headless-shell-linux64"}`, process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell"));
  }
}
const chrome = chromeCandidates.find((candidate) => candidate && existsSync(candidate));
add(
  "chromium",
  Boolean(chrome),
  chrome ?? "not found",
  "install Chrome/Edge, or pass --browser <path>, or run the engine's `browser ensure`",
);

// 4. ffmpeg
const ffmpegCandidates = [
  process.env.HYPERFRAMES_FFMPEG_PATH,
  process.env.FFMPEG_PATH,
  which("ffmpeg"),
].filter(Boolean);
const ffmpeg = ffmpegCandidates.find((candidate) => existsSync(candidate));
add(
  "ffmpeg",
  Boolean(ffmpeg),
  ffmpeg ? `${version(ffmpeg, ["-version"]) ?? "present"} @ ${ffmpeg}` : "not found",
  "install ffmpeg with libx264, or pass --ffmpeg <path>, or set HYPERFRAMES_FFMPEG_PATH",
);

// 5. ffprobe (verification only)
const ffprobe = process.env.FFPROBE_PATH || which("ffprobe");
add(
  "ffprobe",
  Boolean(ffprobe),
  ffprobe ? (version(ffprobe, ["-version"]) ?? "present") : "not found (optional)",
  "optional: used to report codec/frames after a render",
);

// 6. skills present
const skillsDir = join(ROOT, "skills");
const skillCount = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  : 0;
add("skills", skillCount > 0, `${skillCount} original skill(s)`, "skills/ is missing");

// 7. registry
add("registry", existsSync(join(ROOT, "registry", "skills.json")), "registry/skills.json", "run tools/verify-skills.mjs");

const failed = checks.filter((check) => !check.ok);
if (json) {
  console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
} else {
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${check.name.padEnd(10)} ${check.detail}`);
    if (!check.ok && check.hint) console.log(`      hint: ${check.hint}`);
  }
  console.log("");
  console.log(failed.length === 0 ? "ready to render." : `${failed.length} check(s) failed.`);
}
process.exit(failed.length === 0 ? 0 : 1);
