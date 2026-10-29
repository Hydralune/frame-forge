#!/usr/bin/env node
/**
 * frame-forge scaffold — copy the composition template into a new project.
 *
 *   node tools/scaffold.mjs <name> [--dir <parentDir>] [--duration 3] [--size 1920x1080] [--force]
 */
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const TEMPLATE = join(ROOT, "templates", "composition");

function parseArgs(argv) {
  const opts = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") opts.force = true;
    else if (arg === "--dir") opts.dir = argv[++i];
    else if (arg === "--duration") opts.duration = argv[++i];
    else if (arg === "--size") opts.size = argv[++i];
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("-")) {
      console.error(`error: unknown option ${arg}`);
      process.exit(1);
    } else opts.positional.push(arg);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log("usage: node tools/scaffold.mjs <name> [--dir parent] [--duration 3] [--size 1920x1080] [--force]");
  process.exit(0);
}

const name = opts.positional[0];
if (!name) {
  console.error("error: name is required (e.g. node tools/scaffold.mjs my-clip)");
  process.exit(1);
}
if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
  console.error("error: name may only contain letters, digits, dot, dash and underscore");
  process.exit(1);
}

const target = resolve(opts.dir ? resolve(opts.dir) : process.cwd(), name);
if (existsSync(target) && !opts.force) {
  console.error(`error: ${target} already exists (use --force to overwrite)`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(TEMPLATE, target, { recursive: true, force: true });

const indexPath = join(target, "index.html");
let html = readFileSync(indexPath, "utf8");
html = html.replaceAll("__COMPOSITION_ID__", name);

if (opts.size) {
  const match = /^(\d+)x(\d+)$/.exec(String(opts.size));
  if (!match) {
    console.error("error: --size must look like 1920x1080");
    process.exit(1);
  }
  html = html.replace(/data-width="\d+"/, `data-width="${match[1]}"`);
  html = html.replace(/data-height="\d+"/, `data-height="${match[2]}"`);
  html = html.replaceAll("__WIDTH__", match[1]).replaceAll("__HEIGHT__", match[2]);
} else {
  html = html.replaceAll("__WIDTH__", "1920").replaceAll("__HEIGHT__", "1080");
}

const duration = String(opts.duration ?? "3");
if (!/^\d+(\.\d+)?$/.test(duration)) {
  console.error("error: --duration must be a number of seconds");
  process.exit(1);
}
html = html.replace(/data-duration="\d+(?:\.\d+)?"/, `data-duration="${duration}"`);
html = html.replaceAll("__DURATION__", duration);
writeFileSync(indexPath, html, "utf8");

writeFileSync(
  join(target, "meta.json"),
  JSON.stringify({ id: name, name, createdAt: new Date().toISOString(), duration: Number(duration) }, null, 2) + "\n",
  "utf8",
);

console.log(`created ${target}`);
console.log(`next: edit ${join(target, "index.html")} then`);
console.log(`      node tools/render.mjs ${JSON.stringify(target)} --out ${name}.mp4`);
