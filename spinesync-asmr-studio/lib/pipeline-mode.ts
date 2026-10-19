export type PipelineMode = "mock" | "server";

export function getPipelineMode(): PipelineMode {
  return process.env.NEXT_PUBLIC_PIPELINE_MODE === "server" ? "server" : "mock";
}

export const isServerPipeline = getPipelineMode() === "server";
