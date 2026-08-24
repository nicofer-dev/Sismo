import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes import router
from app.services.data_service import load_data

app = FastAPI(title="Estado actual de los municipios - Sismo", version="0.1.0")
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(router)


@app.on_event("startup")
def preload_data():
    load_data()


@app.middleware("http")
async def cache_api_responses(request, call_next):
    response = await call_next(request)
    if request.method == "GET" and request.url.path.startswith("/api/v1/") and response.status_code == 200:
        response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=86400"
    return response


@app.get("/")
def root():
    return {"name": "Estado actual de los municipios - Sismo", "docs": "/docs"}
