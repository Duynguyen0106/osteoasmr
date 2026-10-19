import type React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, useCurrentFrame } from "remotion";

export type SpineSyncReelProps = {
  videoSrc: string;
  practitioner: string;
  cta: string;
  peakFrame: number;
};

export const SpineSyncReel916: React.FC<SpineSyncReelProps> = ({
  videoSrc,
  practitioner,
  cta,
  peakFrame,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(
    frame,
    [peakFrame - 6, peakFrame, peakFrame + 10],
    [1, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#090d16" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          color: "white",
          fontFamily: "sans-serif",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {practitioner}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 24,
          right: 24,
          textAlign: "center",
          color: "white",
          fontFamily: "sans-serif",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        {cta}
      </div>
    </AbsoluteFill>
  );
};
