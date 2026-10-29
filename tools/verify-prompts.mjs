#!/usr/bin/env node
/**
 * frame-forge verify-prompts — schema gate for prompts/*.json.
 *
 *   node tools/verify-prompts.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIR = join(ROOT, "prompts");
const asJson = process.argv.includes("--json");

const problems = [];
const packs = [];

if (!existsSync(DIR)) {
  console.error("error: prompts/ is missing");
  process.exit(1);
}

for (const file of readdirSync(DIR).filter((name) => name.endsWith(".json")).sort()) {
  const path = join(DIR, file);
  let pack;
  try {
    pack = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`${file}: invalid JSON — ${error.message}`);
    continue;
  }
  if (!pack.id) problems.push(`${file}: missing id`);
  if (!Array.isArray(pack.prompts) || pack.prompts.length === 0) {
    problems.push(`${file}: needs a non-empty prompts[]`);
    continue;
  }
  const seen = new Set();
  for (const [index, prompt] of pack.prompts.entries()) {
    const where = `${file}#${index}`;
    if (!prompt.id) problems.push(`${where}: missing id`);
    else if (seen.has(prompt.id)) problems.push(`${where}: duplicate id ${prompt.id}`);
    else seen.add(prompt.id);
    if (!prompt.title) problems.push(`${where}: missing title`);
    if (!prompt.when) problems.push(`${where}: missing when (routing guidance)`);
    if (typeof prompt.text !== "string" || prompt.text.length < 120) {
      problems.push(`${where}: text must be a real instruction (>= 120 chars)`);
    }
    if (!Number.isFinite(prompt.durationSeconds) || prompt.durationSeconds <= 0) {
      problems.push(`${where}: durationSeconds must be a positive number`);
    }
    if (typeof prompt.text === "string") {
      // A prompt that names no timing cannot produce deterministic output.
      const hasTiming = /\b\d+(\.\d+)?\s*(s|ms|seconds)\b/i.test(prompt.text);
      if (!hasTiming) problems.push(`${where}: text names no explicit duration`);
    }
  }
  packs.push({ file, id: pack.id, count: pack.prompts.length });
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, packs, problems }, null, 2));
} else {
  for (const pack of packs) console.log(`ok  ${pack.file.padEnd(24)} ${pack.count} prompt(s)`);
  console.log("");
  if (problems.length === 0) console.log(`verified ${packs.length} pack(s), 0 problems.`);
  else {
    for (const problem of problems) console.log(`FAIL  ${problem}`);
    console.log(`\n${problems.length} problem(s).`);
  }
}
process.exit(problems.length === 0 ? 0 : 1);
