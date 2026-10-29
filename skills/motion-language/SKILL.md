---
name: motion-language
description: Make motion read as intentional instead of decorative — durations, easing families, stagger, beat mapping and pacing for short-form video. Use when a composition looks "animated" but not "designed", or when deciding how long a hold, entrance or transition should be.
metadata:
  provenance: original
  version: "0.1.0"
  category: animation-motion
---

# Motion language

Motion is a **hierarchy of attention**, not a set of effects. Every animated
property should answer: *what should the eye do next?*

## Duration budget

| Move | Duration | Notes |
|---|---|---|
| micro-feedback (hover, toggle) | 90–160 ms | below ~80 ms it reads as a jump |
| entrance of a text block | 320–600 ms | longer only for large area or heavy blur |
| full-screen transition | 500–900 ms | beyond 1 s the viewer starts waiting |
| hold after an entrance | ≥ 1.2 × entrance | the eye needs rest, or nothing lands |
| cross-fade between scenes | 240–400 ms | overlap the outgoing/incoming mount |

Rule of thumb: **the bigger the area, the longer the move**, but never longer than
the time a viewer needs to read the element it reveals.

## Easing families

- **Standard entrance** — `power3.out` (fast in, soft stop). Default for text and cards.
- **Exit** — `power2.in` (start slow, leave quickly). Exits should feel faster than entrances.
- **Symmetrical** — `sine.inOut` for loops and ambient drift.
- **Overshoot** — `back.out(1.4)` only for playful, small targets; never on text you must read.
- **No easing on layout shifts** — if the layout moves, a `linear` or `power1.inOut` keeps the eye oriented.

Never mix more than two easing families in one composition.

## Stagger

- Text lines: `stagger: 0.05–0.08` — sub-word staggering looks like a bug.
- List/grid: `stagger: { each: 0.06, from: "start" }`; with 20+ items use `amount: 0.6` so total time stays bounded.
- Chips/icons around a focal point: stagger **from the center** (`from: "center"`).

## Beat mapping (music-driven pieces)

1. Detect tempo: BPM ÷ 60 = beats per second; 1 beat ≈ `60 / BPM` seconds.
2. Quantize entrances to **half-beats**, not beats, or the cut feels late.
3. Keep the strongest move (scale, colour flip, cut) on a **downbeat**; put secondary motion between beats.
4. Give the piece one **silence** — 300–600 ms with motion stopped. Contrast is what makes the rest feel fast.

## Pacing for short video

- 0–1 s: one idea, one move. The hook must be legible in a single frame.
- 1 s onward: alternate **reveal → hold → reveal**; never chain three reveals without a hold.
- Final 15%: reduce motion. Endings that keep accelerating read as unfinished.
- Total density guide: 1 primary move per 1.5–2.5 s; more than that and nothing is remembered.

## Self-check

- Cover the timeline with your hand at three random instants: is there always exactly one focal point?
- Name the purpose of each move in five words. If you cannot, delete it.
- Turn every duration down by 20% and re-watch. If nothing is lost, keep the shorter one.
