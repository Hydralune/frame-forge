# Contributing

Two kinds of contribution: **skills** (how to make something) and **tooling** (how
to run it).

## Before you start

```bash
node tools/verify-skills.mjs    # provenance + registry must be clean
node tools/verify-prompts.mjs   # prompt packs schema
node tools/doctor.mjs           # engine, chromium, ffmpeg
```

A pull request that breaks any of these is not merged, regardless of content
quality. The gates exist because attribution rot is silent and permanent.

## Adding a skill

```bash
node tools/verify-skills.mjs --new my-skill
```

That creates `skills/my-skill/SKILL.md` with the required frontmatter. Then:

1. Write the frontmatter `description` as **what it enables + when to load it**.
   It is the only part an agent sees before deciding to read the file.
2. Keep the body operational: numbered procedure, tables of numbers, failure modes.
   Prose that could apply to any project is filler and will be asked for removal.
3. Add the path to `registry/skills.json`.
4. `node tools/verify-skills.mjs`.

Guidelines for content:

- Prefer **numbers over adjectives**: `0.4 s power3.out`, `≥ 6% margin`, `4.5:1`.
- Include a *negative* constraint — what must not move, what must not be claimed.
- State the failure symptom next to the fix; agents debug better with symptoms than
  with rules.

## Importing third-party material

Read [docs/provenance-policy.md](docs/provenance-policy.md) first. Short version:

| License | Where it goes |
|---|---|
| MIT / BSD / Apache-2.0 / CC-BY | `third-party/<slug>/` with `LICENSE`, `SOURCE.md`, `NOTICE.md` row |
| GPL / AGPL / unclear / none | `third-party/<slug>-pointer/` — name, one line, URL. No content. |

Never relicense third-party material. Never remove a copyright line. Never copy
content whose license you have not read.

## Changing the tooling

- `tools/*.mjs` is dependency-free ESM on purpose: it must run on a stock Node 22
  with no install step. If you need a dependency, justify it in the PR.
- Windows, macOS and Linux are all supported targets. Use `node:path`, never string
  concatenation for paths; test with a path containing a space.
- Any tool that writes to disk must be idempotent and must refuse to overwrite
  existing output unless a `--force` flag is passed.

## Prompt packs

`prompts/*.json` is validated by `tools/verify-prompts.mjs`: each prompt needs an
`id`, `title`, `when`, a positive `durationSeconds`, and text that names an explicit
timing. Prompts are instructions for an authoring agent, not for a text-to-video
model — they should read like a shot spec.

## Commit style

`<area>: <what changed>` — `skills: add lower-third recipe`, `tools: refuse
overwrite without --force`, `docs: clarify determinism boundary`.

## Licence of contributions

By opening a pull request you agree your contribution is licensed under the MIT
license of this repository, and that any third-party material you add carries a
license permitting redistribution plus the attribution this repository requires.
