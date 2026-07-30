"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type DayCount = { date: string; count: number };

export function PageViewsChart({ data }: { data: DayCount[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 720;
  const height = 160;
  const barGap = 4;
  const barWidth = data.length > 0 ? width / data.length - barGap : 0;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" role="img" aria-label="Page views over the last 14 days">
        {/* recessive baseline */}
        <line x1={0} y1={height} x2={width} y2={height} stroke="var(--border)" strokeWidth={1} />

        {data.map((d, i) => {
          const barHeight = (d.count / max) * (height - 12);
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          const isHovered = hovered === i;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={3}
                fill="var(--accent)"
                opacity={isHovered ? 1 : 0.75}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {new Date(d.date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 h-6 text-center text-xs text-muted">
        {hovered !== null && data[hovered] && (
          <span className={cn("rounded-full bg-surface px-3 py-1")}>
            {data[hovered].count} views on{" "}
            {new Date(data[hovered].date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
