"use client";

import { CHANGE_LOOKBACK_TICKS, TICK_DURATION_SECONDS } from "@/lib/constants";

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  showLabels = false,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  className?: string;
}) {
  if (data.length < 2) return null;

  const yLabelWidth = showLabels ? 40 : 0;
  const xLabelHeight = showLabels ? 16 : 0;
  const chartWidth = width - yLabelWidth;
  const chartHeight = height - xLabelHeight;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = yLabelWidth + (i / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((v - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Color based on N-tick change (matching the displayed change percentage)
  const lookback = Math.min(CHANGE_LOOKBACK_TICKS, data.length - 1);
  const isUp = data[data.length - 1] >= data[data.length - 1 - lookback];

  // X-axis time labels (each data point = 1 tick)
  const totalMinutes = Math.round((data.length * TICK_DURATION_SECONDS) / 60);
  const xLabels: { x: number; text: string }[] = [];
  if (showLabels && data.length > 4) {
    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const x = yLabelWidth + (idx / (data.length - 1)) * chartWidth;
      const minsAgo = totalMinutes - idx;
      const text = minsAgo <= 1 ? "now" : `${minsAgo}m`;
      xLabels.push({ x, text });
    }
  }

  // Y-axis price labels
  const yLabels: { y: number; text: string }[] = [];
  if (showLabels) {
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const val = min + (range * i) / steps;
      const y = chartHeight - (i / steps) * chartHeight;
      yLabels.push({ y, text: formatCompact(val) });
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Y-axis labels */}
      {yLabels.map((label, i) => (
        <text
          key={`y-${i}`}
          x={yLabelWidth - 4}
          y={label.y + 3}
          textAnchor="end"
          fontSize={9}
          fill="var(--color-muted-foreground)"
        >
          {label.text}
        </text>
      ))}

      {/* Chart line */}
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X-axis time labels */}
      {xLabels.map((label, i) => (
        <text
          key={`x-${i}`}
          x={label.x}
          y={height - 2}
          textAnchor={i === xLabels.length - 1 ? "end" : i === 0 ? "start" : "middle"}
          fontSize={9}
          fill="var(--color-muted-foreground)"
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}
