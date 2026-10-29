---
name: render-pipeline
description: Author a video as a single HTML composition and render it deterministically to MP4. Use whenever the deliverable is a video, animation, motion graphic or overlay: it defines the timing attributes, the paused-timeline contract, the render commands, and the failure modes.
metadata:
  provenance: original
  version: "0.1.0"
  category: rendering
---

# Render pipeline

A video here is **one HTML file**. Time lives on the DOM; the renderer seeks the
document to any instant, captures a frame, and encodes. Same HTML + same fps =
same bytes.

## When to use

Load this before writing any composition. It is the contract; the other skills
(`motion-language`, `shot-recipes`, `asset-pipeline`) supply craft on top.

## The contract

1. **Root element** declares the canvas and the total length:
   `<div data-composition-id="ID" data-start="0" data-duration="3" data-width="1920" data-height="1080">`
2. **Every timed element** needs `data-start`, `data-duration`, `data-track-index`,
   and `class="clip"`. `class="clip"` is what the runtime uses for visibility.
3. **The timeline is paused and registered**:
   ```js
   window.__timelines = window.__timelines || {};
   const tl = gsap.timeline({ paused: true });
   window.__timelines["ID"] = tl;   // key must equal data-composition-id
   ```
4. **Deterministic only**: no `Date.now()`, no `Math.random()`, no network fetches
   at seek time, no `setTimeout`-driven state. Randomness can be baked at author
   time into the HTML, never evaluated during render.
5. **Media is owned by the framework**: keep `<video muted>` for visuals and put
   sound in a separate `<audio>` element with `data-start` / `data-duration` /
   `data-volume`.

## Procedure

1. `node tools/scaffold.mjs <name>` — copy the template instead of writing from zero.
2. Fill the root attributes: width, height, duration = last cue + tail.
3. Lay out clips; give each one a `data-track-index` equal to its layer (1 = background, 2 = content, 3 = overlay).
4. Build one timeline; add tweens with an explicit position argument (`0`, `0.4`, `tl.duration()`).
5. `node tools/doctor.mjs` — engine, chromium, ffmpeg must all pass.
6. `node tools/render.mjs <name> --out <name>.mp4 --quality draft` while iterating.
7. Final pass: `--quality high --fps 30` (or `60` only if the motion is fast).

## Failure modes and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| output is a single repeated frame | timeline never registered, or not paused | check the key equals `data-composition-id` |
| first 1–2 frames blank | assets still loading at seek 0 | preload images/fonts; put an explicit 0-length lead-in tween |
| content drifts by a frame or two | animation driven by `requestAnimationFrame` state, not the timeline | move the value into the timeline |
| renders differ between runs | `Math.random()` / `Date.now()` / CSS transition | remove or bake at author time |
| text reflows between runs | webfont not loaded | `document.fonts.ready` before the first tween, or self-host |
| audio missing | `<audio>` inside a `<video>` | use a sibling `<audio>` element with `data-start` |

## Checks before delivering

- `data-duration` on the root ≥ the last visual cue.
- No element extends past the root duration (it would be cut mid-motion).
- Every `class="clip"` element has all three timing attributes.
- Composition works at the smallest target size (test `--resolution portrait`).
- Frames at 0, middle and end are all non-empty: `node tools/render.mjs ... --format png-sequence` and look at three PNGs.
