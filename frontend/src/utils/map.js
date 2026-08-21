export function metricValue(item, metric) {
  if (!item) return 0;
  if (metric === "criticidad") return criticalityValue(item.criticidad_mapa || item.criticidad || item.clasificacion);
  if (metric.startsWith("cat::")) return item.categorias?.[metric.slice(5)] || 0;
  return Number(item[metric] || 0);
}

export function criticalityValue(value) {
  const normalized = String(value || "").toLowerCase().replace(/^afectación\s+/, "").replace("-", " ");
  return ({ "sin clasificación oficial": 0, "sin clasificación": 0, baja: 1, media: 2, "media alta": 3, alta: 4, "muy alta": 5, crítica: 6 }[normalized] ?? 0);
}

export function mapCriticalityValue(item) {
  if (!item) return 0;
  if (item.criticidad && item.criticidad !== "Sin clasificación oficial") return criticalityValue(item.criticidad);
  if (item.puntos > 0 || item.danos > 0 || item.apoyo > 0 || item.afectados_personas > 0 || item.heridos > 0 || item.fallecidos > 0) return 1;
  return 0;
}

export function colorForOfficialCriticality(item) {
  if (!item) return "#E2E8F0";
  if (item.criticidad === "Afectación crítica") return "#991B1B";
  if (item.criticidad === "Afectación muy alta") return "#DC2626";
  if (item.criticidad === "Afectación alta") return "#F97316";
  if (item.criticidad === "Afectación media-alta") return "#FACC15";
  if (item.criticidad === "Afectación media") return "#FEF08A";
  if (item.puntos > 0 || item.danos > 0 || item.apoyo > 0 || item.afectados_personas > 0 || item.heridos > 0 || item.fallecidos > 0) return "#BBF7D0";
  return "#E2E8F0";
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

export function colorForDamage(item, breaks) {
  if (!item) return "#E2E8F0";
  if (!item.danos) return "#BBF7D0";
  if (item.danos <= breaks[0]) return "#FACC15";
  if (item.danos <= breaks[1]) return "#F59E0B";
  if (item.danos <= breaks[2]) return "#F97316";
  return "#DC2626";
}

export function supportDamageScore(item) {
  if (!item) return 0;
  return Number(item.danos || 0) + Number(item.apoyo || 0) * 0.25;
}

export function colorForSupportDamage(item, breaks) {
  if (!item) return "#E2E8F0";
  const score = supportDamageScore(item);
  if (!score) return "#166534";
  if (score <= breaks[0]) return "#166534";
  if (score <= breaks[1]) return "#FACC15";
  if (score <= breaks[2]) return "#F97316";
  return "#DC2626";
}

export function radarRadius(item, maxScore) {
  const score = supportDamageScore(item);
  return score && maxScore ? Math.max(8, 8 + Math.sqrt(score / maxScore) * 23) : 8;
}
