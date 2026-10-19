import { EventEmitter } from "events";
import type { JobStreamEvent } from "@/lib/contract/job";

const globalForBus = globalThis as unknown as {
  jobEventBus?: EventEmitter;
};

function getBus() {
  if (!globalForBus.jobEventBus) {
    globalForBus.jobEventBus = new EventEmitter();
    globalForBus.jobEventBus.setMaxListeners(100);
  }
  return globalForBus.jobEventBus;
}

export function emitJobEvent(jobId: string, event: JobStreamEvent) {
  getBus().emit(`job:${jobId}`, event);
}

export function subscribeJob(jobId: string, listener: (e: JobStreamEvent) => void) {
  const bus = getBus();
  const channel = `job:${jobId}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}
