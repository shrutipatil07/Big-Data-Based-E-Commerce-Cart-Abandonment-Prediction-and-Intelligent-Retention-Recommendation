import sys
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure the backend directory is in the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS, API_PREFIX
from app.services.model_service import model_service
from app.database import init_db
from app.routers import predictions, analytics, model_info

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting application...")
    # Initialize database
    init_db()
    logger.info("Database initialized.")
    # Load model artifacts
    try:
        model_service.load()
        logger.info("Model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.error("The application will start but predictions will not work.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Cart Abandonment Prediction API",
    description="ML-powered e-commerce cart abandonment prediction and intelligent retention recommendation system.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(predictions.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(model_info.router, prefix=API_PREFIX)


@app.get("/health")
async def health_check():
    from datetime import datetime, timezone
    from app.database import get_db
    db_ok = False
    try:
        conn = get_db()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        pass
    return {
        "status": "healthy" if model_service.is_loaded else "degraded",
        "model_loaded": model_service.is_loaded,
        "model_version": model_service.metadata.get("model_version") if model_service.metadata else None,
        "database_connected": db_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
