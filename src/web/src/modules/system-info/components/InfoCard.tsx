import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  rows: { label: string; value: string; mono?: boolean }[];
}

/** Simple info card with key-value rows — used for OS and Process info */
export function InfoCard({ title, icon, rows }: InfoCardProps) {
  return (
    <div className="p-6 rounded-[12px] border border-hairline bg-surface-card hover:border-hairline-strong transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-canvas border border-hairline-soft text-muted">
          {icon}
        </div>
        <span className="font-mono text-[11px] font-semibold text-muted tracking-wide uppercase">
          {title}
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[13px]">
            <span className="text-muted">{row.label}</span>
            <span className={`text-ink ${row.mono !== false ? "font-mono text-[12px]" : ""}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
