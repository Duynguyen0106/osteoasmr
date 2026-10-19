"use client";

export type StudioView = "pipeline" | "editor";

interface StudioViewTabsProps {
  view: StudioView;
  onChange: (view: StudioView) => void;
  editorEnabled: boolean;
}

export function StudioViewTabs({
  view,
  onChange,
  editorEnabled,
}: StudioViewTabsProps) {
  return (
    <div
      className="relative mx-auto flex max-w-7xl justify-center gap-2 px-4 pt-3 sm:px-6"
      role="tablist"
      aria-label="Studio mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "pipeline"}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
          view === "pipeline"
            ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
        onClick={() => onChange("pipeline")}
      >
        Automation pipeline
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "editor"}
        disabled={!editorEnabled}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          view === "editor"
            ? "bg-fuchsia-500/20 text-fuchsia-100 ring-1 ring-fuchsia-400/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
        onClick={() => onChange("editor")}
      >
        Reel Pro Editor
      </button>
    </div>
  );
}
