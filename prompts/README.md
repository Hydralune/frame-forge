# Prompt packs

Prompts here are **inputs for an agent that will author a composition**, not
one-shot text-to-video prompts. Each one assumes the renderer and the authoring
contract in `docs/authoring-contract.md`.

| Pack | Use for | Aspect |
|---|---|---|
| `motion-graphics.json` | logo stings, stat hits, kinetic type, lower thirds | 16:9 |
| `product-launch.json` | product hero, multi-device, feature loops | 16:9 |
| `explainer.json` | concept models, before/after, step sequences | 16:9 |
| `data-story.json` | bar races, counters, route maps | 16:9 |
| `social-overlay.json` | karaoke captions, chat stacks, notifications | 9:16 |
| `cinematic.json` | cold opens, quote cadence, end cards | 16:9 |

## Shape

```json
{
  "id": "motion-graphics",
  "prompts": [
    {
      "id": "logo-sting",
      "title": "Logo sting, 4 s",
      "durationSeconds": 4,
      "when": "A brand mark needs to land and stop.",
      "text": "…the actual instruction…"
    }
  ]
}
```

`durationSeconds` is a constraint the agent must honour: it becomes the root
`data-duration`. `when` is routing guidance, not part of the prompt.

## How to use one

1. `node tools/scaffold.mjs my-clip --duration <durationSeconds>`
2. Hand `text` to the agent together with the `pairsWith` skills.
3. Render `--quality draft`, review against `design-critique`, then final.

## Writing your own

- **Name the numbers**: durations, stagger, easing family, px sizes, durations of
  holds. "Smooth" is not an instruction; `power3.out over 0.4 s` is.
- **State what must not move.** Most amateur-looking output comes from everything
  moving at once; the negative constraint is the valuable half.
- **One idea per prompt.** If it needs two hooks, it is two shots, so say so.
- **No unverifiable claims.** If the piece is data-driven, the prompt must tell the
  agent that the numbers have to be real.

Add a pack: create `prompts/<id>.json`, then `node tools/verify-prompts.mjs`.
