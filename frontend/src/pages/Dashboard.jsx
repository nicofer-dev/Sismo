import { useEffect, useState } from "react";
import { Building2, HeartPulse, Home, Landmark, MapPinned, School, Users, UserRound, Route, ShieldAlert, Flame, Newspaper, PackageOpen, Activity } from "lucide-react";
import Filters from "../components/Filters";
import KpiCard from "../components/KpiCard";

const categoryIcons = {"Edificación colapsada":Building2,"Vivienda afectada":Home,"Hospital o centro de salud":HeartPulse,"Escuela o colegio":School,"Patrimonio o templo":Landmark,"Vía afectada":Route,"Incendio":Flame,"Novedad o noticia":Newspaper};
const fmt=v=>new Intl.NumberFormat("es-CO").format(Number(v||0));
const hasFilters=f=>Boolean(f.department||f.municipality||f.category);
const criticalityRank = value => {
 const normalized=String(value||"").toLowerCase().replace(/^afectación\s+/,"").replace("-"," ");
 return ({crítica:5,"muy alta":4,alta:3,"media alta":2,media:1,baja:0}[normalized]??-1)+1;
};
const criticalityLabel = value => value || "Sin clasificación";

export default function Dashboard({metadata,data,filters,setFilters,loading}){
 const s=data?.summary||{}, items=data?.items||[], official=metadata?.official_summary||{}, filtered=hasFilters(filters);
 const [selectedMunicipality, setSelectedMunicipality] = useState(null);
 useEffect(() => { setSelectedMunicipality(filters.municipality ? items.find(item => item.municipio === filters.municipality) || null : null); }, [data, filters.municipality, items]);
 const one=selectedMunicipality || (items.length===1 ? items[0] : null);
 const ipm2018=one?.ipm_2018 ?? null;
 const ipm2025=filters.department&&items.length?items[0].ipm_2025_departamento:null;
 const main={departamentos:filtered?s.departamentos:official.departamentos,municipios:filtered?s.municipios:official.municipios,heridos:filtered?s.heridos:official.heridos,fallecidos:filtered?s.fallecidos:official.fallecidos};
 const sortedCategories=(metadata?.categories||[]).map(category=>({category,total:s.categorias?.[category]||0})).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,"es"));
 const prioritizedMunicipalities=[...items].sort((a,b)=>criticalityRank(b.criticidad||b.clasificacion)-criticalityRank(a.criticidad||a.clasificacion)||b.puntos-a.puntos||a.municipio.localeCompare(b.municipio,"es"));
 return <div className="page-container">
  <section className="hero"><div><span className="eyebrow">REPORTE TERRITORIAL · SISMO 10/08/2026</span><h1>Estado actual de los municipios - Sismo</h1><p>Seguimiento territorial de daños, población afectada, pobreza multidimensional y respuesta humanitaria.</p></div><div className="hero-badge"><Activity size={28}/><span>{official.magnitud_epicentro?"Magnitud · epicentro":"Municipios analizados"}</span><strong className="hero-badge-text">{official.magnitud_epicentro||fmt(s.municipios)}</strong></div></section>
  <Filters metadata={metadata} filters={filters} setFilters={setFilters}/>
  {loading?<div className="loading">Actualizando indicadores…</div>:<>
   <section className="kpi-grid">
    <KpiCard icon={MapPinned} label="Departamentos" value={fmt(main.departamentos)}/><KpiCard icon={MapPinned} label="Municipios" value={fmt(main.municipios)}/>
    <KpiCard icon={Users} label="Familias afectadas" value={fmt(s.afectados_familia)}/><KpiCard icon={UserRound} label="Personas afectadas" value={fmt(s.afectados_personas)}/>
    <KpiCard icon={HeartPulse} label="Heridos" value={fmt(main.heridos)}/><KpiCard icon={ShieldAlert} label="Fallecidos" value={fmt(main.fallecidos)}/>
    <KpiCard icon={Users} label="IPM municipal 2018" value={ipm2018===null?"—":ipm2018} suffix={ipm2018===null?"":"%"}/><KpiCard icon={Users} label="IPM departamental 2025" value={ipm2025===null?"—":ipm2025} suffix={ipm2025===null?"":"%"}/>
   </section>
    <section className="content-card"><div className="content-header"><div><h2>Afectaciones por categoría</h2><p>Prioridad por criticidad municipal y cantidad de afectaciones registradas.</p></div><div className="points-group"><span className="points-pill">{fmt(s.puntos)} puntos municipales</span></div></div><div className="category-grid">{sortedCategories.map(({category,total})=>{const Icon=categoryIcons[category]||PackageOpen;return <article key={category} className="category-card"><Icon size={19}/><span>{category}</span><strong>{fmt(total)}</strong></article>})}</div><div className="municipality-priority"><h3>Municipios prioritarios</h3><div className="priority-list">{prioritizedMunicipalities.map(item=><article key={item.divipola} role="button" tabIndex="0" className={`priority-item ${one?.divipola===item.divipola?"selected":""}`} onClick={() => setSelectedMunicipality(item)} onKeyDown={event => (event.key === "Enter" || event.key === " ") && setSelectedMunicipality(item)}><div><strong>{item.municipio}</strong><span>{item.departamento} · {fmt(item.puntos)} puntos</span></div><b className={`criticality criticality-${criticalityRank(item.criticidad||item.clasificacion)}`}>{criticalityLabel(item.criticidad||item.clasificacion)}</b><div className="priority-categories">{Object.entries(item.categorias||{}).filter(([,value])=>value>0).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([category,value])=><span key={category}>{category}: <strong>{fmt(value)}</strong></span>)}{!Object.values(item.categorias||{}).some(value=>value>0)&&<span>Sin afectaciones categorizadas</span>}</div></article>)}</div></div></section>
    {one&&<section className="content-card municipal-profile"><div className="content-header"><div><h2>Ficha territorial · {one.municipio}</h2><p>{one.departamento} · DIVIPOLA {one.divipola}</p></div></div><div className="profile-grid"><div><span>Clasificación</span><strong>{one.clasificacion||"—"}</strong></div><div><span>Puntos</span><strong>{fmt(one.puntos)}</strong></div><div><span>Daños y afectaciones</span><strong>{fmt(one.danos)}</strong></div></div>{one.descripcion&&<p className="profile-description">{one.descripcion}</p>}</section>}
  </>}
 </div>
}
