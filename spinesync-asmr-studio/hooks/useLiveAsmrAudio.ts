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
  filter: BiquadFilterNode;
};

export function useLiveAsmrAudio(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: {
    enabled: boolean;
    videoUrl: string | null;
    soundOn: boolean;
    focus: FocusCategory;
    eqBoost: number;
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
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.ratio.value = 3;
      const gain = ctx.createGain();
      source.connect(filter);
      filter.connect(comp);
      comp.connect(gain);
      gain.connect(ctx.destination);
      graph = { video, ctx, gain, filter };
      graphRef.current = graph;
    }

    const profile = getAsmrProfile(options.focus);
    graph.filter.frequency.value = profile.centerHz;
    graph.filter.Q.value = profile.q;
    graph.filter.gain.value = eqBoostToGainDb(options.eqBoost);
    graph.gain.gain.value = options.soundOn ? 1 : 0;

    if (options.soundOn && graph.ctx.state === "suspended") {
      void graph.ctx.resume();
    }

    return () => {
      /* keep graph for same video element */
    };
  }, [
    videoRef,
    options.enabled,
    options.videoUrl,
    options.soundOn,
    options.focus,
    options.eqBoost,
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
