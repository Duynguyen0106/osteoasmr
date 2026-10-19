"use client";

interface ReelScrubberProps {
  durationSec: number;
  currentTimeSec: number;
  peakTimeSec: number;
  onSeek: (timeSec: number) => void;
  disabled?: boolean;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toFixed(1).padStart(m > 0 ? 4 : 3, "0")}`;
}

export function ReelScrubber({
  durationSec,
  currentTimeSec,
  peakTimeSec,
  onSeek,
  disabled,
}: ReelScrubberProps) {
  const safeDuration = Math.max(durationSec, 0.1);
  const peakPercent = (peakTimeSec / safeDuration) * 100;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="relative h-2 rounded-full bg-slate-800/80">
        <div
          className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-amber-400/90 shadow-[0_0_6px_#fbbf24]"
          style={{ left: `${Math.min(100, Math.max(0, peakPercent))}%` }}
          aria-hidden
          title={`Peak @ ${peakTimeSec.toFixed(1)}s`}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-cyan-500/50"
          style={{
            width: `${Math.min(100, (currentTimeSec / safeDuration) * 100)}%`,
          }}
          aria-hidden
        />
        <input
          type="range"
          min={0}
          max={safeDuration}
          step={0.05}
          value={Math.min(currentTimeSec, safeDuration)}
          disabled={disabled}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Seek preview timeline"
          aria-valuemin={0}
          aria-valuemax={safeDuration}
          aria-valuenow={currentTimeSec}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-slate-500">
        <span>{formatTime(currentTimeSec)}</span>
        <span className="text-amber-400/80">peak {formatTime(peakTimeSec)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
}
