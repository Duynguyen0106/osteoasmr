"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SpineSync global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-8 shadow-xl backdrop-blur">
            <h1 className="text-xl font-semibold text-white">
              SpineSync could not load this view
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Production was updated recently. A stale tab or cached bundle can
              trigger this after deploy — try a hard refresh (Ctrl+Shift+R) or
              open{" "}
              <a
                href="https://spinesync-asmr-studio.vercel.app"
                className="text-cyan-400 underline"
              >
                spinesync-asmr-studio.vercel.app
              </a>{" "}
              in a private window.
            </p>
            {error.digest ? (
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                Reference: {error.digest}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
