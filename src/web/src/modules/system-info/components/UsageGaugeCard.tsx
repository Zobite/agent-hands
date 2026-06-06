import type { ReactNode } from "react";
import { getUsageColor } from "../common/format";

interface UsageGaugeCardProps {
  title: string;
  icon: ReactNode;
  usage: number;
  subtitle: string;
  details: { label: string; value: string }[];
}

/** Circular progress gauge card for CPU/Memory/Disk */
export function UsageGaugeCard({ title, icon, usage, subtitle, details }: UsageGaugeCardProps) {
  const color = getUsageColor(usage);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (usage / 100) * circumference;

  return (
    <div className="p-6 rounded-[12px] border border-hairline bg-surface-card hover:border-hairline-strong transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-canvas border border-hairline-soft text-muted">{icon}</div>
        <span className="font-mono text-[11px] font-semibold text-muted tracking-wide uppercase">{title}</span>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90">
            {/* Background track */}
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-hairline-soft)" strokeWidth="8" />
            {/* Usage arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-display font-normal text-ink tracking-[-0.3px]" style={{ color }}>
              {usage}%
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="text-[12px] text-muted-soft mb-2">{subtitle}</div>
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-[13px]">
              <span className="text-muted">{d.label}</span>
              <span className="font-mono text-[12px] text-ink">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
