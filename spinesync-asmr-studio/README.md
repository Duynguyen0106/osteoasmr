# SpineSync ASMR Studio v2.4

Dark medical-tech dashboard for simulated osteopathic ASMR video automation: ingest MP4/MOV, run a six-stage AI pipeline, preview 9:16 reels with waveform peak analytics, GPT-4o-style copy, and multi-channel social dispatch (mocked client-side).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- `framer-motion`, `lucide-react`, `canvas-confetti`

## Project layout

| Path | Role |
|------|------|
| `app/page.tsx` | Server entry → `StudioDashboard` |
| `components/StudioDashboard.tsx` | State orchestrator + responsive grid |
| `components/layout/` | Header, pipeline banner |
| `components/ingestion/` | Dropzone, presets, `IngestionPanel` |
| `components/controls/` | Focus selector, EQ & toggles |
| `components/pipeline/` | Run button, terminal console |
| `components/preview/` | 9:16 player, waveform canvas, subtitles |
| `components/analytics/` | Peak sound metrics |
| `components/thumbnail/` | Peak-frame thumbnail mock |
| `components/copywriter/` | Tabbed captions + clipboard |
| `components/social/` | Platform cards + dispatch actions |
| `hooks/` | Pipeline sequencer, media object URL, waveform canvas |
| `lib/` | Types, presets, pipeline stages, waveform math |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Notes

Pipeline, Whisper, Remotion, GPT-4o, and Ayrshare flows are **UI simulations** for demo and prototyping. Uploaded videos play in the reel preview via object URLs; waveform bars emphasize energy near the mock peak at **4.2s**.
