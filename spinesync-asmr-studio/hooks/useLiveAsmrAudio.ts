"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  eqBoostToGainDb,
  getAsmrProfile,
} from "@/lib/asmr-profiles";
import type { FocusCategory } from "@/lib/types";

type Graph = {
  video: HTMLVideoElement;
  ctx: AudioContext;
  gain: GainNode;
  highpass: BiquadFilterNode;
  peaking: BiquadFilterNode;
  highshelf: BiquadFilterNode;
  comp: DynamicsCompressorNode;
};

export function useLiveAsmrAudio(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: {
    enabled: boolean;
    videoUrl: string | null;
    soundOn: boolean;
    focus: FocusCategory;
    eqBoost: number;
    bypassSculpt: boolean;
  },
) {
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!options.enabled || !options.videoUrl || !video) {
      return;
    }

    let graph = graphRef.current;
    if (!graph || graph.video !== video) {
      if (graphRef.current) {
        void graphRef.current.ctx.close();
      }
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(video);
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 80;
      const peaking = ctx.createBiquadFilter();
      peaking.type = "peaking";
      const highshelf = ctx.createBiquadFilter();
      highshelf.type = "highshelf";
      highshelf.frequency.value = 10_000;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.ratio.value = 3;
      const gain = ctx.createGain();
      source.connect(highpass);
      highpass.connect(peaking);
      peaking.connect(highshelf);
      highshelf.connect(comp);
      comp.connect(gain);
      gain.connect(ctx.destination);
      graph = { video, ctx, gain, highpass, peaking, highshelf, comp };
      graphRef.current = graph;
    }

    const profile = getAsmrProfile(options.focus);
    graph.peaking.frequency.value = profile.centerHz;
    graph.peaking.Q.value = profile.q;

    if (options.bypassSculpt) {
      graph.peaking.gain.value = 0;
      graph.highshelf.gain.value = 0;
    } else {
      graph.peaking.gain.value = eqBoostToGainDb(options.eqBoost);
      graph.highshelf.gain.value = 2;
    }

    graph.gain.gain.value = options.soundOn ? 1 : 0;

    if (options.soundOn && graph.ctx.state === "suspended") {
      void graph.ctx.resume();
    }
  }, [
    videoRef,
    options.enabled,
    options.videoUrl,
    options.soundOn,
    options.focus,
    options.eqBoost,
    options.bypassSculpt,
  ]);

  useEffect(() => {
    return () => {
      if (graphRef.current) {
        void graphRef.current.ctx.close();
        graphRef.current = null;
      }
    };
  }, [options.videoUrl]);
}
