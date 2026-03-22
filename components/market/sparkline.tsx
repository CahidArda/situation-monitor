"use client";

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

  const labelHeight = showLabels ? 16 : 0;
  const chartHeight = height - labelHeight;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = chartHeight - ((v - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];

  // Time labels: each tick is ~60 seconds apart (one per workflow run)
  const totalMinutes = data.length; // approximate
  const labels: { x: number; text: string }[] = [];
  if (showLabels && data.length > 4) {
    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const x = (idx / (data.length - 1)) * width;
      const minsAgo = totalMinutes - idx;
      const text = minsAgo <= 1 ? "now" : `${minsAgo}m ago`;
      labels.push({ x, text });
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLabels &&
        labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 2}
            textAnchor={i === labels.length - 1 ? "end" : i === 0 ? "start" : "middle"}
            fontSize={9}
            fill="var(--color-muted-foreground)"
          >
            {label.text}
          </text>
        ))}
    </svg>
  );
}
