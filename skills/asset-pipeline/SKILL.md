---
name: asset-pipeline
description: Prepare and verify the media a composition needs — audio placement and mixing, voiceover pacing, image sizing, transparent overlays and ffmpeg post-processing. Use when a render has silent or clipped audio, wrong-looking media, or needs a delivery format other than mp4.
metadata:
  provenance: original
  version: "0.1.0"
  category: assets
---

# Asset pipeline

Media is where deterministic renders break. Everything here keeps assets local,
sized and pre-trimmed.

## Audio

**Placement** — one `<audio>` per track, sibling to the visuals:

```html
<audio class="clip" data-start="1.2" data-duration="4.0" data-volume="0.8" src="assets/vo-intro.mp3"></audio>
```

- `data-start` is in seconds on the composition timeline, not in the file.
- Use pre-trimmed files: no `loop`, no playback-rate changes, no mid-file seeking.
  The mixer reads the file straight through, so a loop would extend past the render.
- Keep ≤ 8 simultaneous tracks; more than that is a mix problem, not a track problem.

**Levels** — dialogue peak around -6 dBFS, music bed -18 to -22 dBFS under voice,
duck music by 6–9 dB while the voice is active. Normalize loudness to about
-16 LUFS for web delivery (`ffmpeg -af loudnorm=I=-16:TP=-1.5:LRA=11`).

**Voice pacing** — 140–160 words per minute is comfortable; 2.5 words per second is
the ceiling for text that must be understood. Check the word count before recording.

## Images

- Size images to **2× their on-screen box** for crisp 1080p output, then stop.
  A 6000 px photo scaled to 400 px wastes decode time on every frame.
- Prefer PNG for flat graphics, JPEG (q≈85) for photography, WebP for large stills.
- Name assets by role (`bg-court.png`, not `IMG_2231.png`) so the composition stays readable.
- Keep every asset inside the project folder and reference it relatively — absolute
  paths break on another machine.

## Video-in-video

- `<video muted>` for the picture; the sound lives in a separate `<audio>`.
- Pre-trim clips to the exact in/out you need with ffmpeg first
  (`-ss 4.2 -to 7.0 -c copy`), rather than seeking during render.
- Match the clip's fps to the render fps, or expect judder at the seam.

## Post-processing with ffmpeg

```bash
# verify what you got
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames \
        -show_entries format=duration,size -of json out.mp4

# web-safe re-wrap with faststart (no re-encode)
ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4

# transparent overlay for editors
ffmpeg -i in.mov -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out.mov

# gif for docs: two-pass palette, short and small
ffmpeg -i in.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" out.gif
```

## Checks

- Play the render with audio on, at 100% volume, before delivery. Silent-mixer bugs are invisible in stills.
- Confirm no asset path escapes the project directory (`../` or absolute paths).
- Confirm total audio length ≤ root `data-duration`; longer audio forces a truncated encode.
- For transparent deliveries, open the file on a non-black background — alpha failures hide on black.
