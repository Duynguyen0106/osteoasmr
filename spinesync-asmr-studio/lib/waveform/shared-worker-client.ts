"use client";

import type { AudioPeakProfile } from "@/lib/client-audio-peaks";

type WorkerProfile = AudioPeakProfile;

let sharedPort: MessagePort | null = null;
let connectPromise: Promise<MessagePort | null> | null = null;

function connectSharedWorker(): Promise<MessagePort | null> {
  if (typeof window === "undefined" || typeof SharedWorker === "undefined") {
    return Promise.resolve(null);
  }
  if (sharedPort) return Promise.resolve(sharedPort);
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve) => {
    try {
      const worker = new SharedWorker(
        new URL("../../workers/waveform-shared.worker.ts", import.meta.url),
        { type: "module", name: "spinesync-waveform" },
      );
      sharedPort = worker.port;
      worker.port.start();
      resolve(worker.port);
    } catch {
      resolve(null);
    }
  });

  return connectPromise;
}

export async function decodeAudioViaSharedWorker(
  buffer: ArrayBuffer,
): Promise<WorkerProfile | null> {
  const port = await connectSharedWorker();
  if (!port) return null;

  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as {
        type: string;
        requestId?: string;
        profile?: WorkerProfile;
      };
      if (data.type === "decoded" && data.requestId === requestId && data.profile) {
        port.removeEventListener("message", onMessage);
        resolve(data.profile);
      }
      if (data.type === "decode-error" && data.requestId === requestId) {
        port.removeEventListener("message", onMessage);
        resolve(null);
      }
    };
    port.addEventListener("message", onMessage);
    port.postMessage({ type: "decode", requestId, buffer }, [buffer.slice(0)]);
  });
}

export async function attachWaveformOffscreen(
  canvas: OffscreenCanvas,
  width: number,
  height: number,
  devicePixelRatio: number,
): Promise<MessagePort | null> {
  const port = await connectSharedWorker();
  if (!port) return null;

  port.postMessage(
    {
      type: "attach",
      canvas,
      width,
      height,
      devicePixelRatio,
    },
    [canvas],
  );

  return port;
}

export function postWaveformEnvelope(
  port: MessagePort,
  profile: Pick<WorkerProfile, "envelope" | "durationSec">,
) {
  port.postMessage({
    type: "set-envelope",
    envelopeData: profile.envelope,
    duration: profile.durationSec,
  });
}

export function postWaveformFrame(
  port: MessagePort,
  frame: {
    timeSec: number;
    eqBoost: number;
    sfxCrack: boolean;
    peakTimeSec: number;
  },
) {
  port.postMessage({ type: "frame", ...frame });
}
