from fastapi import APIRouter, Query

from app.services.data_service import CATEGORY_FIELDS, filter_municipalities, load_data, make_summary

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/metadata")
def metadata():
    data = load_data()
    municipalities = data["municipalities"]
    by_department = {}
    for item in municipalities:
        by_department.setdefault(item["departamento"], []).append(item["municipio"])
    for dept in by_department:
        by_department[dept] = sorted(by_department[dept])
    return {
        "departments": data["departments"],
        "municipalities_by_department": by_department,
        "categories": CATEGORY_FIELDS,
        "official_summary": data["official_summary"],
        "map_metrics": [
            {"key": "puntos", "label": "Puntos / casos"},
            {"key": "afectados_personas", "label": "Personas afectadas"},
            {"key": "afectados_familia", "label": "Familias afectadas"},
            {"key": "heridos", "label": "Heridos"},
            {"key": "fallecidos", "label": "Fallecidos"},
        ] + [{"key": f"cat::{c}", "label": c} for c in CATEGORY_FIELDS],
    }


@router.get("/municipalities")
def municipalities(
    department: str | None = Query(default=None),
    municipality: str | None = Query(default=None),
    category: str | None = Query(default=None),
):
    rows = filter_municipalities(department, municipality, category)
    return {"items": rows, "summary": make_summary(rows)}


@router.get("/summary")
def summary(
    department: str | None = Query(default=None),
    municipality: str | None = Query(default=None),
    category: str | None = Query(default=None),
):
    return make_summary(filter_municipalities(department, municipality, category))
