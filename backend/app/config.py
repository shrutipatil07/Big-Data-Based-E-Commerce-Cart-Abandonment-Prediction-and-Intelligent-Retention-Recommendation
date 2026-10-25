import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"

# Model artifact paths
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
SCALER_PATH = ARTIFACTS_DIR / "scaler.joblib"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
FEATURE_SCHEMA_PATH = ARTIFACTS_DIR / "feature_schema.json"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT / 'backend' / 'predictions.db'}")

# API
API_PREFIX = "/api"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "500"))
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

# Risk levels
RISK_LEVELS = {
    "high": {"min": 0.7, "label": "High Risk", "color": "#ef4444"},
    "medium": {"min": 0.4, "label": "Medium Risk", "color": "#f59e0b"},
    "low": {"min": 0.0, "label": "Low Risk", "color": "#22c55e"},
}
