#!/usr/bin/env node
/**
 * frame-forge install-skills — copy skills into an agent's skill directory.
 *
 *   node tools/install-skills.mjs --list
 *   node tools/install-skills.mjs --target dsh
 *   node tools/install-skills.mjs --target claude --only render-pipeline,motion-language
 *   node tools/install-skills.mjs --dir /some/agent/skills
 *   node tools/install-skills.mjs --uninstall --only render-pipeline --target dsh
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const HOME = process.env.HOME || process.env.USERPROFILE || "";

const KNOWN_TARGETS = {
  dsh: join(HOME, ".agents", "skills"),
  claude: join(HOME, ".claude", "skills"),
  codex: join(HOME, ".codex", "skills"),
  cursor: join(HOME, ".cursor", "skills"),
};

function parseArgs(argv) {
  const opts = { targets: [], only: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") opts.list = true;
    else if (arg === "--uninstall") opts.uninstall = true;
    else if (arg === "--target") opts.targets.push(argv[++i]);
    else if (arg === "--all-targets") opts.targets = Object.keys(KNOWN_TARGETS);
    else if (arg === "--only") opts.only = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--include-third-party") opts.includeThirdParty = true;
    else if (arg === "--dir") opts.targets.push(resolve(argv[++i]));
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else {
      console.error(`error: unknown option ${arg}`);
      process.exit(1);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log("usage: node tools/install-skills.mjs [--target dsh|claude|codex|cursor|--dir PATH] [--only a,b] [--include-third-party] [--uninstall] [--list]");
  process.exit(0);
}

function collect() {
  const out = [];
  const add = (tier, dirName) => {
    const full = join(ROOT, tier, dirName);
    if (!existsSync(join(full, "SKILL.md"))) return;
    out.push({ tier, slug: dirName, path: full });
  };
  for (const entry of readdirSync(join(ROOT, "skills"), { withFileTypes: true })) {
    if (entry.isDirectory()) add("skills", entry.name);
  }
  if (opts.includeThirdParty && existsSync(join(ROOT, "third-party"))) {
    for (const entry of readdirSync(join(ROOT, "third-party"), { withFileTypes: true })) {
      if (entry.isDirectory()) add("third-party", entry.name);
    }
  }
  return out;
}

const all = collect();
const selected = opts.only
  ? all.filter((skill) => opts.only.includes(skill.slug) || opts.only.includes(skill.name))
  : all;

if (opts.list) {
  for (const skill of all) {
    const mark = opts.only && !selected.includes(skill) ? " " : "*";
    console.log(`${mark} ${skill.slug.padEnd(28)} ${skill.tier}`);
  }
  console.log(`\n${all.length} available (add --include-third-party for redistributed skills)`);
  process.exit(0);
}

if (!opts.targets.length) {
  console.error("error: pick a target: --target dsh|claude|codex|cursor, or --dir PATH");
  process.exit(1);
}
if (selected.length === 0) {
  console.error("error: nothing matched --only");
  process.exit(1);
}

for (const rawTarget of opts.targets) {
  const target = KNOWN_TARGETS[rawTarget] ?? rawTarget;
  if (!target || !target.trim()) {
    console.error(`error: unknown target ${rawTarget}`);
    continue;
  }
  mkdirSync(target, { recursive: true });
  for (const skill of selected) {
    const destination = join(target, skill.slug);
    if (opts.uninstall) {
      if (existsSync(destination)) {
        rmSync(destination, { recursive: true, force: true });
        console.log(`removed  ${destination}`);
      }
      continue;
    }
    if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });
    cpSync(skill.path, destination, { recursive: true, force: true });
  }
  if (!opts.uninstall) {
    console.log(`installed ${selected.length} skill(s) -> ${target}`);
  }
}

if (!opts.uninstall) {
  console.log("restart or reload your agent so it picks up the new skills.");
}
