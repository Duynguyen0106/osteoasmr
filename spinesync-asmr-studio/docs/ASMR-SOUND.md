# ASMR Sound Feature — Plan & Architecture

## Goal

End-to-end **crack-forward ASMR** for osteopathic reels: detect the adjustment peak, sculpt 2–6 kHz presence, optional crack layer from **bundled WAVs** (`public/audio/cracks/`, regen via `npm run generate:crack-wavs`), **hear it in the preview**, and bake the same files into ffmpeg exports (procedural fallback if assets are missing).

## Signal chain (target)

```text
Ingest (MP4/MOV)
  → Analysis (peak time, RMS envelope, peak dB)
  → Sculpt (focus EQ + compressor + optional crack @ peak)
  → Preview (Web Audio live OR processed reel)
  → Export (eq wav → reel H.264 + AAC)
```

## Layers

| Layer | Responsibility | Implementation |
|--------|----------------|----------------|
| **Profiles** | Focus → center Hz, bandwidth, display | `lib/asmr-profiles.ts` |
| **Analysis** | Peak time, envelope | Web Audio (`useSourceAudioProfile`), ffmpeg (`analyze`, `detectPeakTimeSec`) |
| **Sculpt (server)** | Master EQ + crack mix | `lib/server/audio-eq.ts` |
| **Sculpt (preview)** | Live EQ + scheduled crack @ peak | `hooks/useLiveAsmrAudio.ts`, `lib/crack-samples.ts` |
| **Visual** | Waveform + peak marker | `WaveformCanvas`, shared worker, `ReelScrubber` |
| **Presets** | Per-project sculpt settings | `asmr_presets` SQLite, `/api/asmr-presets` |
| **Export** | Reel uses EQ audio | `render.ts` + pipeline |

## Phases

### Phase 1 — Foundation (done)

- [x] Upload decode + envelope waveform
- [x] Server peak scan (`GET /api/assets?assetId=&analyze=1`)
- [x] EQ stage + SFX crack (ffmpeg `amix`)
- [x] Preview audio unmute + scrubber
- [x] Peak analytics + pipeline peak in result

### Phase 2 — Focus-adaptive sculpt (this pass)

- [x] Shared focus profiles (neck / thoracic / lumbar / shoulder-hip)
- [x] ffmpeg EQ uses profile center frequency + width
- [x] Live Web Audio peaking EQ tied to EQ boost slider
- [x] UI profile card + pipeline logs profile band
- [x] `JobResult.asmrProfile` snapshot on complete

### Phase 3 — Delivery polish (done)

- [x] **Room tone bed** — pink noise mix (~0.035 vol) under voice
- [x] **Multi-band** — 80 Hz HPF + focus peaking + 10 kHz shelf + compressor
- [x] **Crack designer** — intensity slider; secondary transient @ ~55% of peak (≥45%)
- [x] **Loudness** — ffmpeg `loudnorm` **-14 LUFS** on EQ stem
- [x] **A/B preview** — bypass toggle (flat vs sculpted Web Audio)
- [x] **Stem export** — `audio-eq.wav` download + S3 artifact sync
- [x] Sample library for cracks (Phase 4)

### Phase 4 — Pro (done)

- [x] GPU waveform from decoded buffer (shared worker + OffscreenCanvas)
- [x] Real-time crack preview via scheduled AudioBuffer at peak
- [x] Per-project ASMR presets in SQLite (`/api/asmr-presets`)
- [x] Crack sample library (`lib/crack-samples.ts` + WAV assets) — preview + ffmpeg export share `/audio/cracks/*.wav`

## Env / modes

- **Mock mode**: live Web Audio + envelope only (no ffmpeg).
- **Server mode**: full sculpt + reel; preview live chain until job completes, then reel URL.

## Testing

- Unit: profile gain math, envelope bars
- Manual: upload clip with clear crack → peak marker aligns → EQ slider changes timbre live → pipeline reel matches
