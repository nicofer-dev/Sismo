import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { feature } from "topojson-client";
import "leaflet/dist/leaflet.css";
import { Info, MapPinned } from "lucide-react";
import Filters from "../components/Filters";
import { colorFor, colorForOfficialCriticality, colorForSupportDamage, mapCriticalityValue, metricValue, radarRadius, supportDamageScore } from "../utils/map";

function fmt(value) {
  return new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

export default function MonitoringMap({ metadata, data, mapData, filters, setFilters }) {
  const [topology, setTopology] = useState(null);
  const [metric, setMetric] = useState("danos");
  const [selected, setSelected] = useState(null);
  const [centers, setCenters] = useState({});

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
  const damageBreaks = mapData?.damage_breaks || data?.damage_breaks || [1, 3, 6, 13];
  const supportDamageBreaks = useMemo(() => {
    const scores = (mapData?.items || []).map(supportDamageScore).filter(score => score > 0).sort((a, b) => a - b);
    return scores.length ? [.75, .9, .97].map(percentile => scores[Math.floor((scores.length - 1) * percentile)]) : [1, 3, 6];
  }, [mapData]);
  const maxSupportDamageScore = useMemo(() => Math.max(0, ...(mapData?.items || []).map(supportDamageScore)), [mapData]);
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
      fillColor: "transparent",
      weight: selectedCode ? 2.2 : .7,
      color: !visible ? "#CBD5E1" : "#94A3B8",
      fillOpacity: 0,
    };
  };

  const onEachFeature = (geoFeature, layer) => {
    const code = String(geoFeature.properties.codigo_municipio_s).padStart(5, "0");
    const item = byCode[code];
    const center = layer.getBounds().getCenter();
    setCenters(previous => previous[code] ? previous : { ...previous, [code]: [center.lat, center.lng] });
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
        <p>Los círculos muestran la intensidad combinada de daños y puntos de apoyo; los límites municipales sirven como referencia.</p>
      </div>
      <label>Métrica del mapa<select value={metric} onChange={event => setMetric(event.target.value)}>
        {metadata?.map_metrics?.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select></label>
    </section>
    <Filters metadata={metadata} filters={filters} setFilters={setFilters} />
    <div className="map-note"><Info size={15}/><span>El tamaño y color del radar combinan daños y puntos de apoyo con peso moderado para que los apoyos no oculten la severidad de los daños. La clasificación oficial sigue disponible.</span></div>
    <div className="map-layout">
      <section className="map-card">
        {geo ? <MapContainer center={[4.3, -73.4]} zoom={5.3} minZoom={4} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON key={`${metric}-${filters.department}-${filters.municipality}-${filters.category}-${mapData?.items?.length || data?.items?.length || 0}-${selected?.divipola || "none"}`} data={geo} style={style} onEachFeature={onEachFeature} />
          {Object.values(byCode).filter(item => centers[item.divipola] && isVisible(item.divipola)).map(item => {
            const circleColor = metric === "danos" ? colorForSupportDamage(item, supportDamageBreaks) : metric === "criticidad" ? colorForOfficialCriticality(item) : colorFor(valueFor(item), maxValue);
            const isGreen = metric === "danos" && supportDamageScore(item) <= supportDamageBreaks[0];
            const isSupportOnly = !item.danos && item.apoyo > 0;
            const isSelected = selected?.divipola === item.divipola;
            const baseRadius = isGreen ? 4 : radarRadius(item, maxSupportDamageScore);
            const radius = isSelected ? baseRadius + 4 : baseRadius;
            return <CircleMarker key={`${item.divipola}-${metric}-${isSelected ? "selected" : "normal"}`} center={centers[item.divipola]} radius={radius} pathOptions={{ color: isSelected ? "#0F172A" : circleColor, fillColor: circleColor, fillOpacity: isSelected ? .95 : isSupportOnly ? .42 : .7, weight: isSelected ? 3 : isSupportOnly ? .7 : 1 }} eventHandlers={{ click: () => isVisible(item.divipola) && setSelected(item) }}><Tooltip><strong>{item.municipio}</strong><br/>Daños: {fmt(item.danos)} · Apoyo: {fmt(item.apoyo)}</Tooltip></CircleMarker>;
          })}
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
          <span><i style={{ background: "#DC2626" }}/>Alta</span>
          <span><i style={{ background: "#F97316" }}/>Media-alta</span>
          <span><i style={{ background: "#F59E0B" }}/>Media</span>
          <span><i style={{ background: "#FACC15" }}/>Baja con daños</span>
          <span><i style={{ background: "#166534" }}/>Con registro sin daños</span>
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
