import fs from "fs";
import OpenAI from "openai";
import type { CreateJobBody, JobCopyResult } from "@/lib/contract/job";
import {
  type CaptionSegment,
  fallbackCaptionSegments,
  segmentsToVtt,
  whisperVerboseToSegments,
} from "./captions";
import { hasOpenAI, openAIModel } from "./config";
import { buildJobCopy, presetHeadline } from "./copy";
import { runFfmpeg } from "./ffmpeg";

function getClient() {
  if (!hasOpenAI()) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function prepareWhisperAudio(
  sourcePath: string,
  outPath: string,
  eqAudioPath?: string,
): Promise<string> {
  const input = eqAudioPath && fs.existsSync(eqAudioPath) ? eqAudioPath : sourcePath;
  await runFfmpeg([
    "-i",
    input,
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    outPath,
  ]);
  return outPath;
}

export async function transcribeWhisper(
  audioPath: string,
): Promise<{ segments: CaptionSegment[]; vtt: string; provider: string }> {
  const client = getClient();
  if (!client) {
    const segments = fallbackCaptionSegments();
    return {
      segments,
      vtt: segmentsToVtt(segments),
      provider: "fallback",
    };
  }

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "verbose_json",
    });

    const segments = whisperVerboseToSegments(
      transcription as unknown as {
        segments?: Array<{
          start: number;
          end: number;
          text: string;
          words?: Array<{ word: string; start: number; end: number }>;
        }>;
      },
    );

    return {
      segments,
      vtt: segmentsToVtt(segments),
      provider: "openai-whisper-1",
    };
  } catch {
    const segments = fallbackCaptionSegments();
    return {
      segments,
      vtt: segmentsToVtt(segments),
      provider: "openai-fallback",
    };
  }
}

export async function generateGptCopy(
  config: CreateJobBody,
  revision: number,
  context: {
    headline: string;
    peakTimeSec: number;
    captionExcerpt: string;
  },
): Promise<{ copy: JobCopyResult; provider: string }> {
  const fallback = buildJobCopy(config, revision, context.headline);
  const client = getClient();
  if (!client) {
    return { copy: fallback, provider: "template" };
  }

  const model = openAIModel();
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write high-CTR social copy for osteopathic ASMR / spine adjustment Reels. Return JSON with keys: instagram, youtube, hashtags, headline. Hashtags is a single space-separated string including #Osteopath #ASMR.",
      },
      {
        role: "user",
        content: JSON.stringify({
          focus: config.focus,
          sourceLabel: config.sourceLabel,
          eqBoostPercent: config.eqBoost,
          peakTimeSec: context.peakTimeSec,
          captionExcerpt: context.captionExcerpt,
          suggestedHeadline: context.headline,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return { copy: fallback, provider: "template" };

  try {
    const parsed = JSON.parse(raw) as Partial<JobCopyResult>;
    const copy: JobCopyResult = {
      instagram: parsed.instagram ?? fallback.instagram,
      youtube: parsed.youtube ?? fallback.youtube,
      hashtags: parsed.hashtags ?? fallback.hashtags,
      headline: parsed.headline ?? fallback.headline,
      revision,
    };
    return { copy, provider: model };
  } catch {
    return { copy: fallback, provider: "template" };
  }
}

export function headlineForConfig(config: CreateJobBody) {
  return presetHeadline(config.presetId, config.focus);
}
