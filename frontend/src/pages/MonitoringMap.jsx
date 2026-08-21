import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { feature } from "topojson-client";
import "leaflet/dist/leaflet.css";
import { Info, MapPinned } from "lucide-react";
import Filters from "../components/Filters";
import { colorFor, colorForOfficialCriticality, mapCriticalityValue, metricValue } from "../utils/map";

function fmt(value) {
  return new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

export default function MonitoringMap({ metadata, data, mapData, filters, setFilters }) {
  const [topology, setTopology] = useState(null);
  const [metric, setMetric] = useState("criticidad");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/data/mapa_municipios.json").then(response => response.json()).then(setTopology);
  }, []);

  useEffect(() => {
    const municipality = filters.municipality
      ? (data?.items || []).find(item => item.municipio === filters.municipality)
      : null;
    setSelected(municipality || ((data?.items || []).length === 1 ? data.items[0] : null));
  }, [data, filters.municipality]);

  const byCode = useMemo(
    () => Object.fromEntries((mapData?.items || data?.items || []).map(item => [item.divipola, item])),
    [mapData, data],
  );
  const geo = useMemo(
    () => topology ? feature(topology, topology.objects.MGN_MPIO_POLITICO_rJAC) : null,
    [topology],
  );
  const maxValue = metric === "criticidad" ? 6 : (mapData?.scale_max?.[metric] || data?.scale_max?.[metric] || 0);
  const metricLabel = metadata?.map_metrics?.find(item => item.key === metric)?.label || "Puntos / casos";
  const hasActiveFilter = Boolean(filters.department || filters.municipality || filters.category);
  const filteredCodes = useMemo(() => new Set((data?.items || []).map(item => item.divipola)), [data]);
  const isVisible = code => !hasActiveFilter || filteredCodes.has(code);

  const valueFor = item => metric === "criticidad" ? mapCriticalityValue(item) : metricValue(item, metric);
  const style = geoFeature => {
    const code = String(geoFeature.properties.codigo_municipio_s).padStart(5, "0");
    const item = byCode[code];
    const visible = isVisible(code);
    const selectedCode = selected?.divipola === code;
    return {
      fillColor: !visible ? "#E2E8F0" : metric === "criticidad" ? colorForOfficialCriticality(item) : colorFor(valueFor(item), maxValue),
      weight: selectedCode ? 2.6 : visible && item ? 1.1 : .45,
      color: !visible ? "#CBD5E1" : item?.criticidad === "Afectación crítica" ? "#7F1D1D" : item ? "#475569" : "#CBD5E1",
      fillOpacity: selectedCode ? .95 : visible && item ? .82 : .35,
    };
  };

  const onEachFeature = (geoFeature, layer) => {
    const code = String(geoFeature.properties.codigo_municipio_s).padStart(5, "0");
    const item = byCode[code];
    const value = valueFor(item);
    const mapLabel = metric === "criticidad"
      ? (item?.criticidad === "Afectación crítica" ? "Crítico oficial" : item ? "Baja / con datos" : "Sin datos")
      : fmt(value);
    layer.bindTooltip(item
      ? `${!hasActiveFilter || filteredCodes.has(code) ? "" : "<em>Fuera del filtro actual</em><br/>"}<strong>${item.municipio}</strong><br/>${item.departamento}<br/>${metricLabel}: ${mapLabel}<br/>Daños: ${fmt(item.danos)} · Apoyo: ${fmt(item.apoyo)}<br/>Criticidad oficial: ${item.criticidad || "Sin clasificación oficial"}`
      : `DIVIPOLA ${code}`, { sticky: true });
    layer.on({
      click: () => item && isVisible(code) && setSelected(item),
      mouseover: event => event.target.setStyle({ weight: 2.2, color: "#0F172A" }),
      mouseout: event => event.target.setStyle(style(geoFeature)),
    });
  };

  const legendTitle = metric === "criticidad"
    ? "Reporte oficial"
    : metric === "danos" ? "Daños y afectaciones"
      : metric === "apoyo" ? "Apoyo y respuesta" : "Intensidad";

  return <div className="map-page">
    <section className="map-toolbar">
      <div>
        <span className="eyebrow">MONITOREO MUNICIPAL</span>
        <h1>Mapa de daños y afectaciones</h1>
        <p>Los polígonos municipales se colorean según daños, apoyo o reporte crítico oficial.</p>
      </div>
      <label>Métrica del mapa<select value={metric} onChange={event => setMetric(event.target.value)}>
        {metadata?.map_metrics?.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select></label>
    </section>
    <Filters metadata={metadata} filters={filters} setFilters={setFilters} />
    <div className="map-note"><Info size={15}/><span>Rojo oscuro: reporte crítico oficial. Verde claro: municipio con datos, pero sin reporte crítico oficial. Gris: sin datos registrados.</span></div>
    <div className="map-layout">
      <section className="map-card">
        {geo ? <MapContainer center={[4.3, -73.4]} zoom={5.3} minZoom={4} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON key={`${metric}-${filters.department}-${filters.municipality}-${filters.category}-${mapData?.items?.length || data?.items?.length || 0}-${selected?.divipola || "none"}`} data={geo} style={style} onEachFeature={onEachFeature} />
        </MapContainer> : <div className="loading">Cargando cartografía municipal…</div>}
        <div className="legend"><strong>{legendTitle}</strong>{metric === "criticidad" ? <>
          <span><i style={{ background: "#991B1B" }}/>Crítica oficial</span>
          <span><i style={{ background: "#DC2626" }}/>Muy alta oficial</span>
          <span><i style={{ background: "#F97316" }}/>Alta oficial</span>
          <span><i style={{ background: "#FACC15" }}/>Media-alta oficial</span>
          <span><i style={{ background: "#FEF08A" }}/>Media oficial</span>
          <span><i style={{ background: "#BBF7D0" }}/>Con datos / baja</span>
          <span><i style={{ background: "#E2E8F0" }}/>Sin datos</span>
        </> : <>
          <span><i style={{ background: "#991B1B" }}/>Muy alta</span>
          <span><i style={{ background: "#BBF7D0" }}/>Baja</span>
          <span><i style={{ background: "#E2E8F0" }}/>Sin registro</span>
        </>}</div>
      </section>
      <aside className="detail-panel">{selected ? <>
        <div className="detail-title"><MapPinned size={20}/><div><h2>{selected.municipio}</h2><span>{selected.departamento}</span></div></div>
        <div className="detail-metric"><span>{metricLabel}</span><strong>{metric === "criticidad" ? (selected.criticidad !== "Sin clasificación oficial" ? `${selected.criticidad} oficial` : "Baja / con datos") : fmt(valueFor(selected))}</strong></div>
        <dl>
          <div><dt>Puntos totales</dt><dd>{fmt(selected.puntos)}</dd></div>
          <div><dt>Daños y afectaciones</dt><dd>{fmt(selected.danos)}</dd></div>
          <div><dt>Apoyo y respuesta</dt><dd>{fmt(selected.apoyo)}</dd></div>
          <div><dt>Personas afectadas</dt><dd>{fmt(selected.afectados_personas)}</dd></div>
          <div><dt>Heridos</dt><dd>{fmt(selected.heridos)}</dd></div>
          <div><dt>Fallecidos</dt><dd>{fmt(selected.fallecidos)}</dd></div>
          <div><dt>Criticidad oficial</dt><dd>{selected.criticidad || "Sin clasificación oficial"}</dd></div>
        </dl>
        <p className="detail-description">{selected.descripcion || "Sin descripción registrada."}</p>
      </> : <div className="detail-empty"><MapPinned size={34}/><h2>Detalle municipal</h2>{data?.items?.length ? <><p>Selecciona un municipio del filtro actual:</p><div className="filtered-municipalities">{data.items.map(item => <button key={item.divipola} type="button" onClick={() => setSelected(item)}>{item.municipio}<span>{item.departamento}</span></button>)}</div></> : <p>No hay municipios para el filtro actual.</p>}</div>}</aside>
    </div>
  </div>;
}
