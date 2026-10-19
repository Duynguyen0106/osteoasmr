export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  words?: CaptionWord[];
}

export function segmentsToVtt(segments: CaptionSegment[]): string {
  const lines = ["WEBVTT", ""];
  for (const seg of segments) {
    lines.push(
      `${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}`,
      seg.text.trim(),
      "",
    );
  }
  return lines.join("\n");
}

function formatVttTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const wholeSec = Math.floor(s);
  return `${pad(h)}:${pad(m)}:${pad(wholeSec)}.${String(ms).padStart(3, "0")}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function fallbackCaptionSegments(): CaptionSegment[] {
  return [
    { start: 1, end: 4, text: "WAIT FOR THAT DEEP POP..." },
    { start: 4, end: 7, text: "LISTEN TO THIS CRACK..." },
  ];
}

export function whisperVerboseToSegments(data: {
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    words?: Array<{ word: string; start: number; end: number }>;
  }>;
}): CaptionSegment[] {
  if (!data.segments?.length) return fallbackCaptionSegments();
  return data.segments.map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
    words: s.words?.map((w) => ({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
    })),
  }));
}
