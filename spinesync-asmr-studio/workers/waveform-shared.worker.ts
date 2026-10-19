/// <reference lib="webworker" />

import { analyzeChannelEnvelope } from "../lib/audio/envelope";
import { drawWaveformFrame } from "../lib/waveform/draw-frame";

declare const self: SharedWorkerGlobalScope;

type DecodeResult = {
  durationSec: number;
  peakTimeSec: number;
  peakDb: number;
  envelope: number[];
};

let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let dpr = 1;
let envelope: number[] | null = null;
let durationSec = 0;

function reply(port: MessagePort, data: unknown) {
  port.postMessage(data);
}

async function decodeBuffer(buffer: ArrayBuffer): Promise<DecodeResult> {
  const audioCtx = new AudioContext();
  try {
    const decoded = await audioCtx.decodeAudioData(buffer.slice(0));
    const profile = analyzeChannelEnvelope(
      decoded.getChannelData(0),
      decoded.duration,
    );
    return profile;
  } finally {
    await audioCtx.close();
  }
}

function paint(
  port: MessagePort,
  payload: {
    timeSec: number;
    eqBoost: number;
    sfxCrack: boolean;
    peakTimeSec: number;
  },
) {
  if (!offscreen || !ctx) return;
  const w = offscreen.width / dpr;
  const h = offscreen.height / dpr;
  drawWaveformFrame(ctx, w, h, {
    ...payload,
    audioEnvelope: envelope,
    audioDurationSec: durationSec,
  });
  reply(port, { type: "painted" });
}

self.onconnect = (event) => {
  const port = event.ports[0];
  port.start();

  port.onmessage = (ev) => {
    const msg = ev.data as {
      type: string;
      canvas?: OffscreenCanvas;
      width?: number;
      height?: number;
      devicePixelRatio?: number;
      buffer?: ArrayBuffer;
      requestId?: string;
      envelopeData?: number[];
      duration?: number;
      timeSec?: number;
      eqBoost?: number;
      sfxCrack?: boolean;
      peakTimeSec?: number;
    };

    void (async () => {
      switch (msg.type) {
        case "attach": {
          if (msg.canvas) {
            offscreen = msg.canvas;
            ctx = offscreen.getContext("2d");
            dpr = msg.devicePixelRatio ?? 1;
            if (offscreen && msg.width && msg.height) {
              offscreen.width = msg.width * dpr;
              offscreen.height = msg.height * dpr;
              ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
          }
          reply(port, { type: "ready" });
          break;
        }
        case "set-envelope": {
          envelope = msg.envelopeData ?? null;
          durationSec = msg.duration ?? 0;
          reply(port, { type: "envelope" });
          break;
        }
        case "decode": {
          if (!msg.buffer || !msg.requestId) break;
          try {
            const profile = await decodeBuffer(msg.buffer);
            envelope = profile.envelope;
            durationSec = profile.durationSec;
            reply(port, { type: "decoded", requestId: msg.requestId, profile });
          } catch {
            reply(port, { type: "decode-error", requestId: msg.requestId });
          }
          break;
        }
        case "frame": {
          if (
            msg.timeSec == null ||
            msg.eqBoost == null ||
            msg.sfxCrack == null ||
            msg.peakTimeSec == null
          ) {
            break;
          }
          paint(port, {
            timeSec: msg.timeSec,
            eqBoost: msg.eqBoost,
            sfxCrack: msg.sfxCrack,
            peakTimeSec: msg.peakTimeSec,
          });
          break;
        }
        default:
          break;
      }
    })();
  };
};

export {};
