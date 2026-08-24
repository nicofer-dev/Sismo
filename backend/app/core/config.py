from pathlib import Path

# backend/app/core/config.py -> project root is three levels above "core"
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
REVISED_EXCEL_PATH = DATA_DIR / "Analisis_terremoto_2026_Revisado.xlsx"
EXCEL_PATH = REVISED_EXCEL_PATH if REVISED_EXCEL_PATH.exists() else DATA_DIR / "analisis_terremoto_2026.xlsx"
