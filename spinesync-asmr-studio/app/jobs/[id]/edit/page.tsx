import { Suspense } from "react";
import { JobEditContent } from "./JobEditContent";

function EditorFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Loading job editor…
    </div>
  );
}

export default function JobEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <JobEditContent params={params} />
    </Suspense>
  );
}
