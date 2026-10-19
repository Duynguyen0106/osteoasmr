"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  eqBoostToGainDb,
  getAsmrProfile,
} from "@/lib/asmr-profiles";
import {
  getCrackSample,
  previewCrackGain,
  synthesizeCrackBuffer,
  type CrackSampleId,
} from "@/lib/crack-samples";
import { secondaryCrackDelaySec } from "@/lib/asmr-export";
import type { FocusCategory } from "@/lib/types";

type Graph = {
  video: HTMLVideoElement;
  ctx: AudioContext;
  gain: GainNode;
  highpass: BiquadFilterNode;
  peaking: BiquadFilterNode;
  highshelf: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  crackBuffers: Map<CrackSampleId, AudioBuffer>;
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
    sfxCrackPreview: boolean;
    crackIntensity: number;
    crackSampleId: CrackSampleId;
    peakTimeSec: number;
    isPlaying: boolean;
    getTimeSec: () => number;
  },
) {
  const graphRef = useRef<Graph | null>(null);
  const firedPrimaryRef = useRef(false);
  const firedSecondaryRef = useRef(false);
  const prevTimeRef = useRef(0);

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
      graph = {
        video,
        ctx,
        gain,
        highpass,
        peaking,
        highshelf,
        comp,
        crackBuffers: new Map(),
      };
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
    firedPrimaryRef.current = false;
    firedSecondaryRef.current = false;
    prevTimeRef.current = 0;
  }, [options.videoUrl, options.peakTimeSec, options.crackSampleId]);

  const {
    enabled: crackEnabled,
    sfxCrackPreview,
    soundOn,
    bypassSculpt,
    isPlaying,
    getTimeSec,
    peakTimeSec,
    crackIntensity,
    crackSampleId,
    focus,
    videoUrl,
  } = options;

  useEffect(() => {
    if (!crackEnabled || !sfxCrackPreview || !soundOn || bypassSculpt) {
      return;
    }

    const graph = graphRef.current;
    if (!graph) return;

    const playCrack = (sampleId: CrackSampleId, intensityScale = 1) => {
      const sample = getCrackSample(sampleId);
      let buffer = graph.crackBuffers.get(sample.id);
      if (!buffer) {
        buffer = synthesizeCrackBuffer(graph.ctx, sample);
        graph.crackBuffers.set(sample.id, buffer);
      }
      const src = graph.ctx.createBufferSource();
      src.buffer = buffer;
      const g = graph.ctx.createGain();
      g.gain.value =
        previewCrackGain(crackIntensity, focus, sample) * intensityScale;
      src.connect(g);
      g.connect(graph.ctx.destination);
      src.start();
    };

    let raf = 0;
    const tick = () => {
      if (!isPlaying) {
        prevTimeRef.current = getTimeSec();
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = getTimeSec();
      const prev = prevTimeRef.current;
      prevTimeRef.current = t;

      const peak = peakTimeSec;
      const secondaryAt = secondaryCrackDelaySec(peak);

      if (t < peak - 0.6) {
        firedPrimaryRef.current = false;
        firedSecondaryRef.current = false;
      }

      const crossedPrimary = prev < peak && t >= peak;
      if (crossedPrimary && !firedPrimaryRef.current) {
        firedPrimaryRef.current = true;
        playCrack(crackSampleId);
      }

      const crossedSecondary = prev < secondaryAt && t >= secondaryAt;
      if (
        crossedSecondary &&
        !firedSecondaryRef.current &&
        crackIntensity >= 45
      ) {
        firedSecondaryRef.current = true;
        playCrack("syn-ribbon", 0.4);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    crackEnabled,
    sfxCrackPreview,
    soundOn,
    bypassSculpt,
    isPlaying,
    getTimeSec,
    peakTimeSec,
    crackIntensity,
    crackSampleId,
    focus,
  ]);

  useEffect(() => {
    return () => {
      if (graphRef.current) {
        void graphRef.current.ctx.close();
        graphRef.current = null;
      }
    };
  }, [videoUrl]);
}
