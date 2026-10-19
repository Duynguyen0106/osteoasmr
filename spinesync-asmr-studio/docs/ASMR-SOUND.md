# ASMR Sound Feature — Plan & Architecture

## Goal

End-to-end **crack-forward ASMR** for osteopathic reels: detect the adjustment peak, sculpt 2–6 kHz presence, optional synthetic crack layer, **hear it in the preview**, and bake the same chain into ffmpeg exports.

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
| **Sculpt (preview)** | Live peaking EQ on `<video>` | `hooks/useLiveAsmrAudio.ts` |
| **Visual** | Waveform + peak marker | `WaveformCanvas`, `ReelScrubber`, analytics |
| **Export** | Reel uses EQ audio | `render.ts` + pipeline |

## Phases

### Phase 1 — Foundation (done)

- [x] Upload decode + envelope waveform
- [x] Server peak scan (`/api/assets/:id/analyze`)
- [x] EQ stage + SFX crack (ffmpeg `amix`)
- [x] Preview audio unmute + scrubber
- [x] Peak analytics + pipeline peak in result

### Phase 2 — Focus-adaptive sculpt (this pass)

- [x] Shared focus profiles (neck / thoracic / lumbar / shoulder-hip)
- [x] ffmpeg EQ uses profile center frequency + width
- [x] Live Web Audio peaking EQ tied to EQ boost slider
- [x] UI profile card + pipeline logs profile band
- [x] `JobResult.asmrProfile` snapshot on complete

### Phase 3 — Next (backlog)

- [ ] **Room tone bed** — subtle pink noise under voice (-36 LUFS)
- [ ] **Multi-band** — low-cut rumble + presence + air shelf
- [ ] **Crack designer** — intensity slider, second peak, sample library
- [ ] **Loudness** — EBU R128 target (-14 LUFS) on export
- [ ] **A/B preview** — bypass toggle (raw vs sculpted)
- [ ] **Stem export** — separate `audio-eq.wav` download

### Phase 4 — Pro (backlog)

- [ ] GPU waveform from decoded buffer (shared worker)
- [ ] Real-time crack preview via scheduled AudioBuffer at peak
- [ ] Per-project ASMR presets in SQLite

## Env / modes

- **Mock mode**: live Web Audio + envelope only (no ffmpeg).
- **Server mode**: full sculpt + reel; preview live chain until job completes, then reel URL.

## Testing

- Unit: profile gain math, envelope bars
- Manual: upload clip with clear crack → peak marker aligns → EQ slider changes timbre live → pipeline reel matches
