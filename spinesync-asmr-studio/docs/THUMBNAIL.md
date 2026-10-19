# Thumbnail

## Server pipeline

After the 9:16 reel render, **GPT copy** runs, then the **thumbnail** stage:

1. Seeks with `thumbnailSeekOnClip(edit, peak.timeSec)` on `reel.mp4` (fallback: trimmed source).
2. Burns **`copy.headline`** when GPT/template copy exists, else preset headline via `headlineForConfig`.
3. Runs `extractBrandedPeakThumbnail` (`lib/server/thumbnail-render.ts`):
   - Crop/scale to **1080×1920**
   - Mild contrast/saturation (`eq`)
   - **drawtext** headline
4. Writes `thumb.jpg` next to other job artifacts (S3 when configured).

On drawtext/ffmpeg failure, pipeline logs a **raw single-frame fallback**.

## UI

- **`ThumbnailPicker`**: 9:16 preview; baked JPG from job or quick preview API (no CSS headline overlay). Placeholder uses GPT headline when copywriter has refreshed.
- **`JobExportsPanel`**: download labeled **Branded peak thumbnail (9:16)**.

## Phase B — editor thumb time

- **`edit.thumbTimeSec`** (clip-relative, optional): set via **Set thumbnail at playhead** in Reel Pro Editor.
- Pipeline thumbnail stage seeks with `thumbnailSeekOnClip(edit, peak.timeSec)` — defaults to peak when unset.
- Rose marker on timeline when thumb time differs from peak.

## Phase C — quick thumbnail API

- **`POST /api/preview/thumb`** — same body as `/api/preview/reel` plus optional `headline` (dashboard sends GPT/preset headline).
- **`buildIncrementalThumbPreview`** reuses the cached quick reel in `previews/{cacheId}/reel.mp4`, then bakes `thumb-{headlineHash}.jpg` beside it.
- Editor **Quick thumbnail** button and **`useIncrementalPreview.bakeThumb`**; dashboard prefers pipeline `thumb` URL, then quick preview URL.

## Phase D — GPT headline + Ayrshare thumb

- Pipeline stage order: **gpt → thumbnail** so burn-in matches copywriter headline.
- **`POST /api/jobs/:id/publish`**: Ayrshare payload includes `isVideo`, `youTubeOptions.title` + `youTubeOptions.thumbNail`, and `twitterOptions.thumbNail` when a public HTTPS thumb URL resolves (`publishThumbUrlForJob`).

## Not yet

- Instagram/TikTok-specific cover APIs beyond platform defaults; Remotion text overlays.
