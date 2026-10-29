---
name: storyboard
description: Turn a one-paragraph brief into a reviewable storyboard and then into a renderable composition. Use at the start of any video task — it fixes duration, shot list, on-screen copy and audio beats before any HTML is written, so the render is a transcription rather than a discovery.
metadata:
  provenance: original
  version: "0.1.0"
  category: workflow
---

# Storyboard

Most re-work in video comes from authoring HTML before the shot list exists. This
skill forces the cheap decisions first.

## Stage 1 — Brief (5 lines, no HTML)

```text
Audience:      who watches this, in one phrase
Single claim:  the one sentence they should repeat afterwards
Duration:      target seconds (default 15; 6 s for an overlay, 30 s for an explainer)
Delivery:      aspect, fps, format (mp4 / transparent webm / gif)
Audio:         none | music bed | voiceover | sfx only
```

If any line is unknown, state an assumption and continue. Do not ask more than one
question, and only if the answer changes the shot count.

## Stage 2 — Shot table (one row per shot)

| # | Seconds | Shot | On-screen text (≤ 14 words) | Motion | Asset |
|---|---|---|---|---|---|
| 1 | 0.0–2.0 | hook | 87% of teams skip this | number scale-in | – |
| 2 | 2.0–5.0 | comparison | before / after | two-column slide | 2 screenshots |
| 3 | 5.0–7.5 | proof | "cut render time 6×" | count-up | – |
| 4 | 7.5–10.0 | CTA | try it — link below | card reveal | logo |

Rules: one idea per row; total seconds must equal the target; each row names its
`shot-recipes` pattern.

## Stage 3 — Composition skeleton

Convert the table mechanically:

1. root `data-duration` = sum of shots.
2. one wrapper `<div class="clip" data-start="<offset>" data-duration="<len>" data-track-index="N">` per shot.
3. timeline: build each shot's tweens at `tl.time(offset)` positions — do not use
   `delay`, use absolute positions so re-timing one shot does not shift the rest.
4. audio: place `<audio>` beats on the same offsets as the shot changes.

## Stage 4 — Review loop

- Render `--quality draft` at half the target fps (15) for the review pass; it
  halves render time and the timing judgment is unchanged.
- Review against `design-critique`, fix blockers only.
- Re-render at target settings once.

## Stage 5 — Deliver

Ship: the mp4, the `index.html` (editable source), and a note of the exact render
command + engine version, so the result is reproducible.

## Anti-patterns

- Writing shot 2 and 3 before shot 1 is final — the hook dictates pacing.
- Scene counts above `duration / 2.5` — the piece becomes a slideshow.
- Narration word count above `duration × 2.5` words — that is the comfortable
  speaking rate; more means the voiceover will be cut or sped up.
