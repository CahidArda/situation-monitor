export function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(1);
  return price.toFixed(2);
}

export function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${formatPrice(change)} (${sign}${percent.toFixed(2)}%)`;
}

export function changeColor(change: number): string {
  if (change > 0) return "text-emerald-600";
  if (change < 0) return "text-red-600";
  return "text-muted-foreground";
}
