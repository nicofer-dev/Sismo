import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MonitoringMap from "./pages/MonitoringMap";
import { api } from "./services/api";
import "./styles/global.css";

export default function App(){
  const [page,setPage]=useState("dashboard");
  const [metadata,setMetadata]=useState(null);
  const [data,setData]=useState(null);
  const [filters,setFilters]=useState({department:"",municipality:"",category:""});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.metadata().then(setMetadata).catch(console.error); },[]);
  useEffect(()=>{ setLoading(true); api.municipalities(filters).then(setData).catch(console.error).finally(()=>setLoading(false)); },[filters]);
  return <Layout page={page} setPage={setPage}>{page === "dashboard" ? <Dashboard metadata={metadata} data={data} filters={filters} setFilters={setFilters} loading={loading}/> : <MonitoringMap metadata={metadata} data={data} filters={filters} setFilters={setFilters}/>}</Layout>;
}
