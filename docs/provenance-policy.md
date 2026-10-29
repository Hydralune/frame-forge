# Provenance policy

An open-source skill library is mostly *other people's writing*. The project stays
usable and legally boring only if every file can be answered for.

## Three provenance classes

Every skill directory declares exactly one in `metadata.provenance`.

### `original`

Written for this repository. Lives under `skills/`. MIT.

Adding one: `node tools/verify-skills.mjs --new <slug>` creates the frontmatter and
section skeleton; fill it in, add the path to `registry/skills.json`.

### `redistributed`

Third-party content whose license permits redistribution (MIT, Apache-2.0, BSD,
CC-BY). Lives under `third-party/`. Requirements, enforced by
`tools/verify-skills.mjs`:

1. `LICENSE` (or `LICENSE.txt`) — the upstream text, **unmodified**;
2. `SOURCE.md` — upstream URL, copyright line, license, and an explicit
   "Modifications" section listing every change made when importing;
3. a row in `NOTICE.md`;
4. the registry entry carries `license`.

Permitted modifications: adding/rewriting YAML frontmatter so CI can enforce
attribution. Anything else (rewording content, deleting examples) turns the entry
into a derivative work and must be described in `SOURCE.md`.

### `upstream-pointer`

Content that cannot be redistributed: no license file, an unclear grant, or a
license incompatible with MIT. Lives under `third-party/<name>-pointer/` and holds
**only** a name, one line of description and a URL. `tools/fetch-upstream.mjs`
clones it to the user's machine under the upstream terms.

The pointer rule keeps the repository clean while still telling an agent that the
capability exists.

## Decision table when importing something new

| License found | Action |
|---|---|
| MIT / BSD / Apache-2.0 / CC-BY | `redistributed`, keep text, add `SOURCE.md` + `NOTICE.md` row |
| GPL / AGPL | `upstream-pointer` (do not link it into MIT code) |
| "All rights reserved", none, or a custom EULA | `upstream-pointer` |
| Content whose copyright line you cannot find | `upstream-pointer` and open an issue upstream |

## What CI enforces

`node tools/verify-skills.mjs` fails when:

- a skill has no `name` / `description`;
- a `third-party/` skill omits `metadata.provenance`;
- a `redistributed` skill lacks `LICENSE` or `SOURCE.md` or its `NOTICE.md` row;
- an `upstream-pointer` body exceeds 4 KB (a pointer that grows into a copy);
- a directory exists under `skills/` or `third-party/` that the registry does not
  list, or the registry lists something that is not there.

## Answering "where did this file come from?"

Three places, in order: the skill's own `SOURCE.md` → the `NOTICE.md` table → the
registry entry. If any of the three disagrees, the file is wrong; fix the file.
