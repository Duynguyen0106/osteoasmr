# Thumbnail (Phase A)

## Server pipeline

After the 9:16 reel render, the **thumbnail** stage:

1. Seeks to `peak.timeSec` on `reel.mp4` (fallback: trimmed source).
2. Runs `extractBrandedPeakThumbnail` (`lib/server/thumbnail-render.ts`):
   - Crop/scale to **1080×1920**
   - Mild contrast/saturation (`eq`)
   - **drawtext** headline from `headlineForConfig` (preset focus/preset id)
3. Writes `thumb.jpg` next to other job artifacts (S3 when configured).

On drawtext/ffmpeg failure, pipeline logs a **raw single-frame fallback**.

## UI

- **`ThumbnailPicker`**: 9:16 preview; baked JPG from job (no CSS headline overlay). Placeholder before pipeline shows preset headline mock only.
- **`JobExportsPanel`**: download labeled **Branded peak thumbnail (9:16)**.

## Phase B — editor thumb time

- **`edit.thumbTimeSec`** (clip-relative, optional): set via **Set thumbnail at playhead** in Reel Pro Editor.
- Pipeline thumbnail stage seeks with `thumbnailSeekOnClip(edit, peak.timeSec)` — defaults to peak when unset.
- Rose marker on timeline when thumb time differs from peak.

## Not yet (later phases)

- Quick preview thumb API, GPT headline on image, social attach.
