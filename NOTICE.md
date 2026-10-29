# NOTICE

frame-forge is an independent project: a skill library plus a deterministic
HTML→MP4 render pipeline. The code in `tools/`, the `templates/`, `docs/`,
`prompts/`, `registry/` and the skills marked `provenance: original` were written
for this repository and are MIT licensed (see [LICENSE](LICENSE)).

Nothing here is a copy of another application's source code.

## Redistributed in `third-party/`

Each directory keeps the upstream `LICENSE` verbatim plus a `SOURCE.md` recording
origin and the only modification (frontmatter metadata added for CI enforcement).

| Directory | Copyright (as stated in the shipped LICENSE) | License |
|---|---|---|
| `third-party/gsap-core` | Copyright (c) 2026 GreenSock | MIT |
| `third-party/gsap-timeline` | Copyright (c) 2026 GreenSock | MIT |
| `third-party/gsap-plugins` | Copyright (c) 2026 GreenSock | MIT |
| `third-party/gsap-scrolltrigger` | Copyright (c) 2026 GreenSock | MIT |
| `third-party/animate` | Copyright (c) 2026 Emil Kowalski | MIT |
| `third-party/design-taste-frontend` | Copyright (c) 2026 Leonxlnx | MIT |
| `third-party/image-to-code` | Copyright (c) 2026 Leonxlnx | MIT |
| `third-party/ui-animation` | Copyright (c) 2026 Matthew Blode | MIT |
| `third-party/web-clone` | Copyright (c) 2026 Jane (@xiaoerzhan / 小耳) | MIT |
| `third-party/motion-lab` | yangxu128 and Motion.Lab contributors | MIT |
| `third-party/frontend-design` | see the directory's `LICENSE.txt` | Apache-2.0 |

**Upstream repository URLs are not recorded for four of these** (`animate`,
`design-taste-frontend`, `image-to-code`, `ui-animation`) because the copy we
received did not carry one. Their copyright lines and license texts did. Before
publishing a fork, resolve those URLs from the upstream projects and fill them into
the relevant `SOURCE.md`, or drop the directory.

These MIT entries may be redistributed provided the copyright notice and permission
notice travel with them — which is exactly why `LICENSE` is kept per directory and
this file exists. If you strip a directory, strip its row here too.

## Pointers only — nothing redistributed

`registry/skills.json` also lists `provenance: upstream-pointer` entries (Remotion,
three.js, Playwright). Those carry only a name, a one-line description written for
this project, and a URL. `tools/fetch-upstream.mjs` clones them onto the user's
machine under the upstream project's own terms. No third-party content ships for them.

## Not included

Deliberately absent, because their license status could not be established:
material shipped inside commercial design applications without a license file or
copyright line. The equivalent capability here is provided by the original skills
in `skills/`.

## Trademarks

GSAP, Chrome, FFmpeg, HyperFrames, Remotion, three.js, Playwright and any product
name mentioned in the documentation are trademarks of their respective owners and
are used descriptively only.
