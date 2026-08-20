# Estado actual de los municipios - Sismo

Aplicación web monolítica modular para analizar las afectaciones asociadas al sismo del 10 de agosto de 2026.

## Estructura

- `backend/`: API FastAPI organizada por módulos (`api`, `core`, `models`, `services`).
- `frontend/`: React + Vite + Leaflet, separado por componentes, páginas, servicios, estilos y utilidades.
- `data/`: fuente de datos principal (`analisis_terremoto_2026.xlsx`).
- `frontend/public/data/mapa_municipios.json`: TopoJSON municipal utilizado por el visor.
- `docs/`: documentación y validaciones del proyecto.

## Vista 1 — Panel general

Filtros por departamento, municipio y categoría. Incluye KPI de departamentos, municipios, familias y personas afectadas, heridos, fallecidos, IPM municipal 2018 e IPM departamental 2025, además del consolidado de las 18 categorías y la tabla de ayudas.

## Vista 2 — Monitoreo municipal

Mapa coroplético por polígono municipal. Permite seleccionar la métrica (puntos, población, heridos, fallecidos o cualquiera de las 18 categorías). El cruce entre Excel y mapa se realiza por DIVIPOLA.

## Ejecutar backend (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

API: `http://127.0.0.1:8001`  
Swagger: `http://127.0.0.1:8001/docs`

Si el puerto está ocupado, puedes elegir otro antes de ejecutar el backend:

```powershell
$env:PORT=8002
python run.py
```

## Ejecutar frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

## Fuente de datos

La primera versión conserva el Excel como fuente principal, tal como fue solicitado. La capa de servicios está separada para facilitar la posterior migración a PostgreSQL sin alterar los componentes del frontend.

## Despliegue gratuito

El frontend puede publicarse en Vercel y la API en Hugging Face Spaces usando el `Dockerfile` de la raíz. La API debe escuchar en el puerto `7860`.
