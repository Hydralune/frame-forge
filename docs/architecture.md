# Architecture

```
            ┌──────────────────────────────┐
  agent ───►│ skills/*/SKILL.md            │  how to decide what to build
            └──────────────┬───────────────┘
                           │ writes
                           ▼
            ┌──────────────────────────────┐
            │ <project>/index.html         │  DOM + data-* attributes + paused GSAP timeline
            └──────────────┬───────────────┘
                           │ tools/render.mjs
                           ▼
            ┌──────────────────────────────┐
            │ render engine (dependency)   │  headless chromium → per-frame capture
            └──────────────┬───────────────┘
                           │ frame sequence
                           ▼
            ┌──────────────────────────────┐
            │ ffmpeg                       │  h264 / vp9 / prores, audio mux
            └──────────────┬───────────────┘
                           ▼
                       out.mp4
```

## Why the engine is a dependency, not vendored code

`tools/render.mjs` resolves a renderer CLI and spawns it. It contains no capture or
encoding logic. Consequences:

- the repository stays small and MIT-clean;
- the engine can be upgraded without touching this project;
- anyone can substitute a different conforming engine via `--engine`.

Resolution order:

1. `--engine <path>`
2. `FRAMEFORGE_ENGINE`
3. `node_modules/hyperframes/bin/hyperframes.mjs` (or `.bin/hyperframes`)
4. `FRAMEFORGE_ENGINE_BUNDLED` (opt-in convenience for an engine shipped by another local app)
5. hard failure with an install hint

## The engine interface we depend on

Only four things, which any conforming renderer must provide:

| Capability | Used for |
|---|---|
| `render <dir> --output <file>` | the whole pipeline |
| `--fps`, `--quality`, `--format`, `--workers`, `--crf` | delivery variants |
| per-frame progress on stdout/stderr | streaming progress to the caller |
| non-zero exit + stderr on failure | error surfacing |

If a candidate engine does not implement these, wrap it in a shim script and point
`--engine` at the shim.

## Determinism boundary

| Layer | Deterministic? | Why |
|---|---|---|
| HTML + CSS | yes | static file |
| GSAP timeline (paused, absolute positions) | yes | pure function of the seek time |
| asset loading | **no** unless awaited | fonts/images resolve asynchronously |
| engine capture | yes, if GPU/SwiftShader config is fixed | `--no-browser-gpu` forces software raster |
| ffmpeg encode | yes for the same build and args | codec version differences shift bytes |

The single most common reproducibility bug is an unawaited font. Wait on
`document.fonts.ready` before registering the timeline.

## Skill layers

- **decide** — `storyboard` (what shots, how long), `design-critique` (is it good enough)
- **make** — `shot-recipes` (form), `motion-language` (timing), `asset-pipeline` (media)
- **ship** — `render-pipeline` (contract + render + failure table)

Third-party skills under `third-party/` cover specialist depth (GSAP API surface,
motion case library, site reconstruction). They are optional; the original six are
the spine.
