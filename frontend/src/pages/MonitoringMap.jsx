import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { feature } from "topojson-client";
import "leaflet/dist/leaflet.css";
import { MapPinned, Info } from "lucide-react";
import Filters from "../components/Filters";
import { colorFor, metricValue } from "../utils/map";

function fmt(v){ return new Intl.NumberFormat("es-CO").format(Number(v || 0)); }

export default function MonitoringMap({ metadata, data, filters, setFilters }) {
  const [topology, setTopology] = useState(null);
  const [metric, setMetric] = useState("criticidad");
  const [selected, setSelected] = useState(null);
  useEffect(() => { fetch("/data/mapa_municipios.json").then(r => r.json()).then(setTopology); }, []);
  useEffect(() => {
    const filteredMunicipality = filters.municipality ? (data?.items || []).find(item => item.municipio === filters.municipality) : null;
    setSelected(filteredMunicipality || ((data?.items || []).length === 1 ? data.items[0] : null));
  }, [data, filters.municipality]);
  const byCode = useMemo(() => Object.fromEntries((data?.items || []).map(x => [x.divipola, x])), [data]);
  const geo = useMemo(() => topology ? feature(topology, topology.objects.MGN_MPIO_POLITICO_rJAC) : null, [topology]);
  const maxValue = metric === "criticidad" ? 6 : (data?.scale_max?.[metric] || 0);
  const metricLabel = metadata?.map_metrics?.find(x => x.key === metric)?.label || "Puntos / casos";

  const style = (f) => {
    const item = byCode[String(f.properties.codigo_municipio_s).padStart(5,"0")];
    const value = metricValue(item, metric);
    return { fillColor: colorFor(value, maxValue), weight: item ? 1.1 : .45, color: item?.criticidad === "Afectación crítica" ? "#7F1D1D" : item ? "#475569" : "#CBD5E1", fillOpacity: item ? .82 : .35 };
  };
  const onEachFeature = (f, layer) => {
    const code = String(f.properties.codigo_municipio_s).padStart(5,"0");
    const item = byCode[code];
    const value = metricValue(item, metric);
    layer.bindTooltip(item ? `<strong>${item.municipio}</strong><br/>${item.departamento}<br/>${metricLabel}: ${metric === "criticidad" ? (item.criticidad || "Sin clasificación oficial") : fmt(value)}<br/>Criticidad: ${item.criticidad || "Sin clasificación oficial"}` : `DIVIPOLA ${code}`, {sticky:true});
    layer.on({ click: () => item && setSelected(item), mouseover: e => e.target.setStyle({weight:2.2,color:"#0F172A"}), mouseout: e => e.target.setStyle(style(f)) });
  };

  return <div className="map-page"><section className="map-toolbar"><div><span className="eyebrow">MONITOREO MUNICIPAL</span><h1>Mapa de intensidad de afectaciones</h1><p>Los polígonos municipales se colorean según la métrica seleccionada.</p></div><label>Métrica del mapa<select value={metric} onChange={e => setMetric(e.target.value)}>{metadata?.map_metrics?.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label></section>
    <Filters metadata={metadata} filters={filters} setFilters={setFilters}/><div className="map-note"><Info size={15}/><span>La criticidad oficial proviene de la clasificación municipal del Excel. Las métricas numéricas conservan una escala global para que el color no cambie al filtrar.</span></div><div className="map-layout"><section className="map-card">{geo ? <MapContainer center={[4.3,-73.4]} zoom={5.3} minZoom={4} style={{height:"100%",width:"100%"}} zoomControl={true}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><GeoJSON key={`${metric}-${filters.department}-${filters.municipality}-${filters.category}-${data?.items?.length || 0}`} data={geo} style={style} onEachFeature={onEachFeature}/></MapContainer> : <div className="loading">Cargando cartografía municipal…</div>}<div className="legend"><strong>{metric === "criticidad" ? "Criticidad oficial" : "Intensidad"}</strong><span><i style={{background:"#991B1B"}}/>{metric === "criticidad" ? "Crítica" : "Muy alta"}</span><span><i style={{background:"#DC2626"}}/>{metric === "criticidad" ? "Muy alta / alta" : "Alta"}</span><span><i style={{background:"#F97316"}}/>{metric === "criticidad" ? "Media-alta" : "Media-alta"}</span><span><i style={{background:"#FACC15"}}/>{metric === "criticidad" ? "Media" : "Media"}</span><span><i style={{background:"#BBF7D0"}}/>{metric === "criticidad" ? "Sin clasificación" : "Baja"}</span><span><i style={{background:"#E2E8F0"}}/>Sin registro</span></div></section>
      <aside className="detail-panel">{selected ? <><div className="detail-title"><MapPinned size={20}/><div><h2>{selected.municipio}</h2><span>{selected.departamento}</span></div></div><div className="detail-metric"><span>{metricLabel}</span><strong>{fmt(metricValue(selected,metric))}</strong></div><dl><div><dt>Puntos</dt><dd>{fmt(selected.puntos)}</dd></div><div><dt>Personas afectadas</dt><dd>{fmt(selected.afectados_personas)}</dd></div><div><dt>Familias afectadas</dt><dd>{fmt(selected.afectados_familia)}</dd></div><div><dt>Heridos</dt><dd>{fmt(selected.heridos)}</dd></div><div><dt>Fallecidos</dt><dd>{fmt(selected.fallecidos)}</dd></div><div><dt>IPM 2018</dt><dd>{selected.ipm_2018}%</dd></div><div><dt>IPM Dpto. 2025</dt><dd>{selected.ipm_2025_departamento}%</dd></div></dl><p className="detail-description">{selected.descripcion || "Sin descripción registrada."}</p></> : <div className="detail-empty"><MapPinned size={34}/><h2>Detalle municipal</h2>{data?.items?.length ? <><p>Selecciona un municipio del filtro actual:</p><div className="filtered-municipalities">{data.items.map(item => <button key={item.divipola} type="button" onClick={() => setSelected(item)}>{item.municipio}<span>{item.departamento}</span></button>)}</div></> : <p>No hay municipios para el filtro actual.</p>}</div>}</aside>
    </div></div>
}
