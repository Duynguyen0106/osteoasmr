"use client";

import type { FocusCategory } from "@/lib/types";

const CATEGORIES: { id: FocusCategory; label: string }[] = [
  { id: "neck", label: "Neck" },
  { id: "lumbar", label: "Lumbar" },
  { id: "thoracic", label: "Thoracic Rib" },
  { id: "shoulder-hip", label: "Shoulder/Hip" },
];

interface FocusSelectorProps {
  value: FocusCategory;
  onChange: (value: FocusCategory) => void;
}

export function FocusSelector({ value, onChange }: FocusSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">
        Adjustment focus
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              value === cat.id
                ? "bg-purple-500/25 text-purple-200 ring-1 ring-purple-400/40"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
