from pathlib import Path

# backend/app/core/config.py -> project root is three levels above "core"
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
EXCEL_PATH = DATA_DIR / "analisis_terremoto_2026.xlsx"
