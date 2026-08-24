import { Activity, BarChart3, Map } from "lucide-react";

export default function Layout({ page, setPage, children }) {
  return <div className="app-shell">
    <header className="navbar">
      <div className="brand"><Activity size={24}/><div><strong>Estado actual de los municipios - Sismo</strong><span>Evento del 10 de agosto de 2026 - Actualización 24 de agosto de 2026</span></div></div>
      <nav>
        <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}><BarChart3 size={17}/> Panel general</button>
        <button className={page === "map" ? "active" : ""} onClick={() => setPage("map")}><Map size={17}/> Monitoreo</button>
      </nav>
    </header>
    <main>{children}</main>
    <footer><div>Visor territorial de afectaciones · Colombia · Corte de información 2026</div><div className="sources">Fuentes: <a href="https://www.mapadelterremoto.com/" target="_blank" rel="noreferrer">Mapa del terremoto de Colombia - sismo del 10 de agosto de 2026</a><span>·</span><a href="https://portal.gestiondelriesgo.gov.co/Paginas/inicio.aspx" target="_blank" rel="noreferrer">Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD)</a></div></footer>
  </div>
}
