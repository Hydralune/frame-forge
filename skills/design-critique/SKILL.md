---
name: design-critique
description: A measurable pre-delivery gate for visual work — hierarchy, contrast ratios, spacing rhythm, typographic scale, colour discipline and motion restraint, with numeric thresholds. Use before showing any composition, page or frame to a client, or when a design "feels off" but the cause is unclear.
metadata:
  provenance: original
  version: "0.1.0"
  category: design-review
---

# Design critique

"Looks good" is not a check. Each item below has a number or a binary test.

## 1. Hierarchy

- Exactly **one** element is the largest in the frame. If two compete, demote one.
- Type scale ratio ≥ **1.33** between adjacent levels (e.g. 132 / 44 / 20).
  Ratios under 1.2 read as an accident.
- Squint test: blur the frame (or step back 3 m). You must still identify the
  primary element. If the blur is uniform mush, contrast is missing.

## 2. Contrast

| Pair | Minimum |
|---|---|
| body text on background | 4.5:1 |
| large text (≥ 24px bold / 32px regular) | 3:1 |
| UI borders and dividers | 3:1 |
| decorative accents | no requirement, but must not carry meaning alone |

Never encode meaning in hue alone — add a label, weight or shape.

## 3. Spacing rhythm

- Pick a base unit (8 px is the safe default) and make **every** margin a multiple.
- Internal spacing ≤ external spacing: elements closer to each other than to their
  container edge belong together. If that is violated, the grouping reads wrong.
- Edge margins in video: keep ≥ **6%** of the shortest side clear. Text inside 2%
  of an edge gets clipped on some players.

## 4. Typography

- Max **2** families, max **3** weights.
- Line length 45–75 characters; for 1080p title cards, one idea per line.
- Letter-spacing: negative (-0.02 to -0.04 em) for ≥ 96 px display type, zero or
  slightly positive for body. Never tighten body text.
- No orphan words in a headline: re-break the line instead.

## 5. Colour

- One dominant neutral, one accent, optionally one secondary. Three accent hues is
  a carnival, not a system.
- Accent used for **≤ 10%** of the frame area.
- Check the darkest and lightest element: if the whole frame sits in a narrow
  luminance band, it will look flat regardless of hue.

## 6. Motion (for video)

- One focal move per 1.5–2.5 s; see `motion-language`.
- Nothing moves during the CTA hold except a ≤ 2% ambient drift.
- No entrance longer than 0.9 s.

## 7. Delivery integrity

- Render three stills (start / middle / end) and inspect at 100%.
- Check the smallest target viewport, not just the hero size.
- Verify text is selectable-correct in the stills (no tofu, no fallback font).
- Confirm the file plays in a second player (browser + VLC) before sending.

## Report format

When reviewing, output findings as: **severity (blocker / should-fix / nit) —
location — observation — fix**. Blockers are only: unreadable text, clipped
content, broken asset, wrong duration, motion that misrepresents the content.
