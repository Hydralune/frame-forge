---
name: shot-recipes
description: Twelve ready-to-adapt shot patterns for HTML compositions — hook, stat hit, comparison, timeline, quote, product hero, list reveal, chart race, transition, logo lockup, CTA and loop. Use when you know the message but not the visual form, or when a sequence needs variety.
metadata:
  provenance: original
  version: "0.1.0"
  category: motion
---

# Shot recipes

Each recipe is a **DOM + timeline** pattern. Copy the skeleton, replace the content.
All examples assume a `1920×1080` root and `class="clip"` on timed elements.

## 1. Hook — one number, one claim
Full-bleed background, a single oversized value, nothing else.
```html
<div class="clip" data-start="0" data-duration="2" data-track-index="2"
     style="inset:0;display:grid;place-items:center;font-size:220px;font-weight:800">87%</div>
```
Timeline: value scales `0.92 → 1` with `power4.out` in 0.5 s, then holds still.
**Why it works:** the viewer has nothing else to read, so the number becomes the subject.

## 2. Stat hit — number + unit + source
Number counts up only if the count itself is the message; otherwise reveal it whole.
Add the source line small, bottom-left, fading in 0.3 s after the number lands.

## 3. Comparison — A vs B, split
Two columns, a vertical rule between them; slide each column in from its own side
(0.45 s, `power3.out`, 0.08 s offset). Never fade both in simultaneously: the
contrast has to *arrive* as contrast.

## 4. Timeline — 3–5 beats on a rail
Horizontal rail drawn with `scaleX` from `0 → 1` (0.6 s), then dots pop in on
`stagger: 0.12`. Labels appear after their dot, never before.

## 5. Quote — text at reading size, one accent
Max 14 words on screen. The accent is one word or one phrase, coloured, not bolded
twice. Attribution appears 0.4 s later, smaller, muted.

## 6. Product hero — device frame + screen content
Use a device shell as a static layer, put the "screen" as an inner element with
`overflow:hidden`, then reveal the inner content with a clip-path wipe. Do not
scale the whole device: it reads as a zoom, not as a product.

## 7. List reveal — three items maximum
Enter items with `stagger: { each: 0.09, from: "start" }`; the *current* item may
scale to 1.02 while the others sit at 0.98 opacity. More than five items belongs
in a chart, not a list.

## 8. Chart race — bars grow, axis fixed
Axis and labels mount first (static), bars animate `scaleX` from the left with
`transform-origin: left`. Animate one bar per 0.15 s; highlight the winner last,
with colour, not with scale.

## 9. Transition — match cut on a shared element
Keep one element identical across scenes (a rule, a dot, a colour block); move
everything else. A shared element makes the cut feel designed rather than edited.
Duration 300–450 ms.

## 10. Logo lockup — reveal by mask, not by scale
Large logo enters via `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` over 0.6 s,
then the wordmark fades 0.25 s later. Scaling a logo up always looks cheap.

## 11. CTA — one action, contrasting surface
Dark composition → light card, or inverse. The CTA text is the largest element in
the final 2 s, and it must be readable in a still frame.

## 12. Loop — seam at zero
For a seamless loop, the first and last frame must be identical: author the
timeline so the closing tween returns every property to its start value, and set
root `data-duration` to exactly the loop length.

## Sequence assembly

A 15 s piece usually needs 4–6 shots, not 12. Pattern: hook (2 s) → 2–3 body shots
(3 s each) → CTA (2–3 s). Vary **camera distance**, not just content: wide → medium
→ close keeps attention; five medium shots do not.
