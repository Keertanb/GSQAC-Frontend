export const STATUS_COLORS = {
  Completed: "#10b981",
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  "Not Allocated": "#ef4444",
};

export function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

export function getRateColor(rate) {
  if (rate >= 80) return "#059669";
  if (rate >= 60) return "#22c55e";
  if (rate >= 30) return "#eab308";
  return "#ef4444";
}
