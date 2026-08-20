export function metricValue(item, metric) {
  if (!item) return 0;
  if (metric.startsWith("cat::")) return item.categorias?.[metric.slice(5)] || 0;
  return Number(item[metric] || 0);
}

export function colorFor(value, maxValue) {
  if (!value || value <= 0) return "#E2E8F0";
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio >= 0.8) return "#991B1B";
  if (ratio >= 0.6) return "#DC2626";
  if (ratio >= 0.4) return "#F97316";
  if (ratio >= 0.2) return "#FACC15";
  return "#BBF7D0";
}
