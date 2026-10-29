# Authoring contract

The renderer does exactly three things: load the HTML, seek the timeline to a
timestamp, capture a frame. Everything else is your composition's problem. This
document is the contract your HTML must satisfy.

## Document shape

```html
<div data-composition-id="ID"     <!-- required, unique per composition -->
     data-start="0"                <!-- reserved, keep 0 -->
     data-duration="3"             <!-- total length in seconds -->
     data-width="1920"
     data-height="1080">
  ...
</div>
```

`data-duration` is authoritative: the renderer computes
`frameCount = ceil(duration * fps)` and stops there. Anything animating past that
point is never captured. Set it to `last cue end + tail`.

## Timed elements

```html
<div class="clip" data-start="0.4" data-duration="2.6" data-track-index="2">…</div>
```

| Attribute | Meaning | If omitted |
|---|---|---|
| `class="clip"` | marks the element as runtime-managed | the runtime will not manage its visibility; it may render during the whole piece |
| `data-start` | when the element becomes visible, seconds | treated as 0 |
| `data-duration` | how long it stays visible | treated as the composition duration |
| `data-track-index` | layer order; higher sits on top | stacking falls back to DOM order, which breaks under nesting |

## Timeline

```js
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["ID"] = tl;   // key MUST equal data-composition-id
```

Three rules that cause most failures:

1. **`paused: true`** — an autoplaying timeline advances with real time and the
   capture loop will race it.
2. **The key must match** `data-composition-id`; a mismatch means the renderer
   drives an empty timeline and you get a static frame repeated N times.
3. **Absolute positions**, not `delay`: `tl.from(x, {...}, 2.4)` survives re-timing
   a neighbouring tween; `.delay(2.4)` does not.

## Determinism

Banned at render time: `Date.now()`, `new Date()`, `Math.random()`,
`performance.now()`, network requests, `setTimeout`-driven state changes,
CSS `transition`/`animation` on properties the timeline also touches.

If the design calls for randomness (a scatter, a glitch), generate the values once
at author time and inline the numbers.

## Media

- `<video muted>` for pictures. Sound lives in a sibling `<audio>` with
  `data-start` / `data-duration` / `data-volume`.
- Audio files must be local, relative, pre-trimmed, non-looping, normal speed.
- Every asset path stays inside the project directory.

## Sub-compositions

```html
<div class="clip" data-start="2" data-duration="4"
     data-composition-src="compositions/lower-third.html"></div>
```

A sub-composition is a complete document with its own root and its own
`window.__timelines` entry. Its internal time starts at zero; the parent's
`data-start` offsets it.

## Resolution independence

Lay out in percentages or in `em` where possible. `--resolution portrait` in the
renderer changes the canvas, not your CSS, so absolute pixel layouts will crop.
Test at least the smallest target you will ship.

## What the renderer reports

On success: `{ ok, output, bytes, elapsedMs, framesCaptured, video: { codec, width,
height, frameRate, frames, durationSeconds } }`. On failure: a non-zero exit and the
engine's stderr tail. A "success" with `bytes <= 32` is treated as a failure.
