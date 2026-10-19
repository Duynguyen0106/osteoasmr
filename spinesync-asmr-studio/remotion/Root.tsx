import type React from "react";
import { Composition } from "remotion";
import { SpineSyncReel916, type SpineSyncReelProps } from "./SpineSyncReel916";

export const RemotionRoot: React.FC = () => {
  const defaultProps: SpineSyncReelProps = {
    videoSrc: "",
    practitioner: "Dr. Smith | SpineSync",
    cta: "SpineSync Clinic | Book Link in Bio",
    peakFrame: 120,
  };

  return (
    <>
      <Composition
        id="SpineSyncReel916"
        component={SpineSyncReel916}
        durationInFrames={30 * 12}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};
