#!/usr/bin/env node
/**
 * frame-forge verify-skills — enforce the provenance policy in CI.
 *
 *   node tools/verify-skills.mjs            # check everything, exit 1 on violation
 *   node tools/verify-skills.mjs --json     # machine readable
 *   node tools/verify-skills.mjs --new foo  # print the frontmatter to fill in
 *
 * Rules
 *   1. every skill has name + description in YAML frontmatter
 *   2. provenance ∈ {original, redistributed, upstream-pointer}
 *   3. redistributed ⇒ LICENSE file + SOURCE.md + a NOTICE.md mention
 *   4. original ⇒ declared under skills/, never under third-party/
 *   5. registry/skills.json lists exactly the skill directories that exist
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const newIx = args.indexOf("--new");

/** Minimal YAML frontmatter reader: nested maps by indentation, no flow style. */
function readFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = text.slice(3, end);
  const out = {};
  let parent = null;
  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;
    const indented = /^\s+\S/.test(rawLine);
    const line = rawLine.trim();
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length > 1) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'") && value.length > 1) value = value.slice(1, -1);
    if (indented && parent) {
      out[parent] ??= {};
      if (value) out[parent][key] = value;
    } else if (value) {
      out[key] = value;
      parent = null;
    } else {
      out[key] = {};
      parent = key;
    }
  }
  return out;
}

if (newIx !== -1) {
  const slug = args[newIx + 1];
  if (!slug) {
    console.error("usage: node tools/verify-skills.mjs --new <slug>");
    process.exit(1);
  }
  const dir = join(ROOT, "skills", slug);
  const file = join(dir, "SKILL.md");
  if (existsSync(file)) {
    console.error(`error: ${file} already exists`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });
  const template = `---
name: ${slug}
description: One sentence: what this skill makes the agent able to do, and when to load it.
metadata:
  provenance: original
  version: "0.1.0"
---

# ${slug}

## When to use

## Procedure

1.

## Checks

`;
  writeFileSync(file, template, "utf8");
  console.log(`created ${file}`);
  console.log("fill in the sections, then run: node tools/verify-skills.mjs");
  process.exit(0);
}

const noticeText = existsSync(join(ROOT, "NOTICE.md")) ? readFileSync(join(ROOT, "NOTICE.md"), "utf8") : "";
const problems = [];
const rows = [];

function scan(tier) {
  const base = join(ROOT, tier === "original" ? "skills" : "third-party");
  if (!existsSync(base)) return;
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(base, entry.name);
    const skillFile = join(dir, "SKILL.md");
    const rel = `${tier === "original" ? "skills" : "third-party"}/${entry.name}`;
    if (!existsSync(skillFile)) {
      problems.push(`${rel}: missing SKILL.md`);
      continue;
    }
    const fm = readFrontmatter(readFileSync(skillFile, "utf8"));
    if (!fm) {
      problems.push(`${rel}: no YAML frontmatter`);
      continue;
    }
    const meta = fm.metadata || {};
    if (!fm.name) problems.push(`${rel}: frontmatter has no name`);
    if (!fm.description) problems.push(`${rel}: frontmatter has no description`);
    const provenance = meta.provenance ?? (tier === "original" ? "original" : null);
    if (!provenance) problems.push(`${rel}: metadata.provenance is required for third-party skills`);
    if (tier === "original" && provenance && provenance !== "original") {
      problems.push(`${rel}: a skill under skills/ must declare provenance: original`);
    }
    if (tier === "third-party" && provenance === "original") {
      problems.push(`${rel}: original work belongs under skills/, not third-party/`);
    }
    if (provenance === "redistributed" && tier === "third-party") {
      const licenses = readdirSync(dir).filter((name) => /^LICENSE/i.test(name));
      if (licenses.length === 0) problems.push(`${rel}: redistributed but no LICENSE file`);
      if (!existsSync(join(dir, "SOURCE.md"))) problems.push(`${rel}: redistributed but no SOURCE.md`);
      if (!noticeText.includes(entry.name)) problems.push(`${rel}: not listed in NOTICE.md`);
    }
    if (provenance === "upstream-pointer" && tier === "third-party") {
      const body = readFileSync(skillFile, "utf8");
      if (body.length > 4000) {
        problems.push(`${rel}: upstream-pointer must stay a thin pointer (< 4 KB), found ${body.length} bytes`);
      }
    }
    rows.push({ path: rel, name: fm.name ?? entry.name, provenance: provenance ?? "unknown", files: readdirSync(dir).length });
  }
}

scan("original");
scan("third-party");

// registry consistency
const registryPath = join(ROOT, "registry", "skills.json");
let registry = null;
if (!existsSync(registryPath)) {
  problems.push("registry/skills.json is missing");
} else {
  registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const declared = new Set((registry.skills || []).map((skill) => skill.path));
  for (const row of rows) {
    if (!declared.has(row.path)) problems.push(`registry/skills.json does not list ${row.path}`);
  }
  for (const path of declared) {
    if (!rows.some((row) => row.path === path)) problems.push(`registry lists ${path} but no such skill directory exists`);
  }
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, skills: rows, problems }, null, 2));
} else {
  for (const row of rows) {
    console.log(`ok  ${row.path.padEnd(38)} ${row.provenance.padEnd(18)} ${row.files} file(s)`);
  }
  console.log("");
  if (problems.length === 0) {
    console.log(`verified ${rows.length} skill(s), ${registry?.skills?.length ?? 0} registry entr(ies), 0 problems.`);
  } else {
    for (const problem of problems) console.log(`FAIL  ${problem}`);
    console.log("");
    console.log(`${problems.length} problem(s).`);
  }
}
process.exit(problems.length === 0 ? 0 : 1);
