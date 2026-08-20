export default function KpiCard({ icon: Icon, label, value, suffix = "" }) {
  return <article className="kpi-card"><div className="kpi-icon"><Icon size={21}/></div><div><span>{label}</span><strong>{value ?? 0}{suffix}</strong></div></article>
}
