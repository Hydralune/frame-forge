#!/usr/bin/env node
/**
 * frame-forge fetch-upstream — retrieve material for `upstream-pointer` entries.
 *
 * The repository never redistributes content it cannot license. Entries marked
 * `upstream-pointer` carry only a name, a description written here, and a URL.
 * This tool fetches the real material onto the user's machine, under the
 * upstream project's own terms.
 *
 *   node tools/fetch-upstream.mjs --list
 *   node tools/fetch-upstream.mjs --slug remotion --dry-run
 *   node tools/fetch-upstream.mjs --slug remotion --yes
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

function parseArgs(argv) {
  const opts = { slugs: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") opts.list = true;
    else if (arg === "--slug") opts.slugs.push(argv[++i]);
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--yes") opts.yes = true;
    else if (arg === "--into") opts.into = argv[++i];
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
  console.log("usage: node tools/fetch-upstream.mjs [--list] [--slug name] [--dry-run] [--yes] [--into third-party]");
  process.exit(0);
}

const registry = JSON.parse(readFileSync(join(ROOT, "registry", "skills.json"), "utf8"));
const pointers = (registry.skills || []).filter((skill) => skill.provenance === "upstream-pointer");

if (opts.list || (!opts.slugs.length && !opts.list)) {
  if (!pointers.length) console.log("no upstream-pointer entries in the registry.");
  for (const entry of pointers) {
    console.log(`${entry.name.padEnd(30)} ${entry.upstream ?? "(no url)"}`);
  }
  console.log(`\n${pointers.length} pointer(s). Nothing is redistributed by this repository.`);
  if (!opts.slugs.length) process.exit(0);
}

const into = resolve(ROOT, opts.into ?? "third-party");
let failures = 0;

for (const slug of opts.slugs) {
  const entry = pointers.find((candidate) => candidate.name === slug || candidate.path === `third-party/${slug}`);
  if (!entry) {
    console.error(`error: ${slug} is not an upstream-pointer entry`);
    failures += 1;
    continue;
  }
  if (!entry.upstream) {
    console.error(`error: ${slug} has no upstream URL recorded`);
    failures += 1;
    continue;
  }
  const destination = join(into, slug);
  if (existsSync(destination)) {
    console.error(`error: ${destination} exists — remove it first if you want a fresh fetch`);
    failures += 1;
    continue;
  }
  const fetch = entry.fetch ?? { type: "git" };
  const command = fetch.type === "npm"
    ? ["npm", ["pack", entry.upstream, "--pack-destination", into]]
    : ["git", ["clone", "--depth", "1", ...(fetch.ref ? ["--branch", fetch.ref] : []), entry.upstream, destination]];

  console.log(`$ ${command[0]} ${command.slice(1).join(" ")}`);
  if (opts.dryRun || !opts.yes) {
    console.log("  (dry run — pass --yes to execute)");
    continue;
  }
  mkdirSync(into, { recursive: true });
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
  if (result.status !== 0) {
    failures += 1;
    continue;
  }
  if (fetch.type !== "npm") {
    writeFileSync(
      join(destination, "SOURCE.md"),
      `# Source\n\nFetched by tools/fetch-upstream.mjs, not redistributed by this repository.\n\n` +
      `- upstream: ${entry.upstream}\n- fetched: ${new Date().toISOString()}\n` +
      `- license: see the upstream repository; do not assume this project's license applies.\n`,
      "utf8",
    );
  }
  console.log(`fetched -> ${destination}`);
}

process.exit(failures === 0 ? 0 : 1);
