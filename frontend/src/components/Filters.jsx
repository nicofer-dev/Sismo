import { Filter, RotateCcw } from "lucide-react";

export default function Filters({ metadata, filters, setFilters }) {
  const municipalities = filters.department
    ? metadata?.municipalities_by_department?.[filters.department] || []
    : Object.values(metadata?.municipalities_by_department || {}).flat().sort();

  const update = (key, value) => setFilters(prev => ({
    ...prev,
    [key]: value,
    ...(key === "department" ? { municipality: "" } : {}),
  }));

  return <section className="filters-card">
    <div className="section-title"><Filter size={18}/><div><h2>Filtros territoriales</h2><p>Refina el análisis de afectaciones.</p></div></div>
    <div className="filters-grid">
      <label>Departamento<select value={filters.department} onChange={e => update("department", e.target.value)}><option value="">Todos</option>{metadata?.departments?.map(d => <option key={d}>{d}</option>)}</select></label>
      <label>Municipio<select value={filters.municipality} onChange={e => update("municipality", e.target.value)}><option value="">Todos</option>{municipalities.map((m, index) => <option key={`${filters.department || "todos"}-${m}-${index}`}>{m}</option>)}</select></label>
      <label>Categoría<select value={filters.category} onChange={e => update("category", e.target.value)}><option value="">Todas</option>{metadata?.categories?.map(c => <option key={c}>{c}</option>)}</select></label>
      <button className="reset-button" onClick={() => setFilters({department:"", municipality:"", category:""})}><RotateCcw size={16}/> Limpiar filtros</button>
    </div>
  </section>
}
