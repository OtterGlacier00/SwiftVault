"use client";

export default function Progress({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 my-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-panel2 border border-hairline overflow-hidden">
        <div
          className="h-full rounded-full bg-success transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted whitespace-nowrap">
        {value}/{total} · {pct}%
      </span>
    </div>
  );
}
