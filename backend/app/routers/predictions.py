import csv
import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas import (
    PredictionInput, PredictionResult, BatchPredictionInput,
    BatchPredictionResult, PredictionHistoryResponse, PredictionHistoryItem
)
from app.services.prediction_service import make_prediction
from app.services.model_service import model_service
from app.database import get_prediction_history
from app.config import MAX_BATCH_SIZE, MAX_UPLOAD_SIZE_MB

router = APIRouter(tags=["predictions"])


@router.post("/predict", response_model=PredictionResult)
async def predict_single(input_data: PredictionInput):
    """Run a single cart abandonment prediction."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Check /health endpoint.")
    try:
        result = make_prediction(input_data.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResult)
async def predict_batch(batch: BatchPredictionInput):
    """Run batch predictions."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    if len(batch.records) > MAX_BATCH_SIZE:
        raise HTTPException(status_code=400, detail=f"Batch too large. Max {MAX_BATCH_SIZE} records.")

    predictions = []
    errors = []
    for i, record in enumerate(batch.records):
        try:
            result = make_prediction(record.model_dump())
            predictions.append(result)
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    return {
        "total": len(batch.records),
        "successful": len(predictions),
        "failed": len(errors),
        "predictions": predictions,
        "errors": errors,
    }


@router.post("/predict/csv", response_model=BatchPredictionResult)
async def predict_from_csv(file: UploadFile = File(...)):
    """Upload a CSV file and get batch predictions."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_SIZE_MB}MB.")

    # Parse CSV
    try:
        text = contents.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing failed: {str(e)}")

    if len(rows) == 0:
        raise HTTPException(status_code=400, detail="CSV has no data rows.")
    if len(rows) > MAX_BATCH_SIZE:
        raise HTTPException(status_code=400, detail=f"CSV has {len(rows)} rows. Max {MAX_BATCH_SIZE}.")

    # Validate columns
    required = set(model_service.metadata["feature_names"])
    actual = set(rows[0].keys())
    missing = required - actual
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {sorted(missing)}")

    # Parse and predict
    predictions = []
    errors = []
    for i, row in enumerate(rows):
        try:
            parsed = {}
            for feat in model_service.metadata["feature_names"]:
                val = row[feat]
                if feat == "session_duration_sec" or feat == "hist_conversion_rate":
                    parsed[feat] = float(val)
                else:
                    parsed[feat] = int(float(val))
            result = make_prediction(parsed)
            predictions.append(result)
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    return {
        "total": len(rows),
        "successful": len(predictions),
        "failed": len(errors),
        "predictions": predictions,
        "errors": errors,
    }


@router.get("/predictions/history", response_model=PredictionHistoryResponse)
async def get_history(page: int = 1, page_size: int = 20, risk_level: str = None):
    """Get prediction history with pagination."""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    total, items = get_prediction_history(page, page_size, risk_level)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            PredictionHistoryItem(
                id=item["id"],
                prediction_id=item["prediction_id"],
                predicted_class=item["predicted_class"],
                predicted_label=item["predicted_label"],
                abandonment_probability=item["abandonment_probability"],
                risk_level=item["risk_level"],
                model_version=item["model_version"],
                retention_action=item.get("retention_action", ""),
                created_at=item["created_at"],
            )
            for item in items
        ],
    }
