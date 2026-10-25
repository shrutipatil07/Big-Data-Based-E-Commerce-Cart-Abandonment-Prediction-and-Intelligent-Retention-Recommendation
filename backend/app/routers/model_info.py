from fastapi import APIRouter, HTTPException
from app.services.model_service import model_service
from app.schemas import ModelMetadataResponse

router = APIRouter(tags=["model"])


@router.get("/model/metadata", response_model=ModelMetadataResponse)
async def get_model_metadata():
    """Get model metadata and evaluation results."""
    if not model_service.is_loaded or not model_service.metadata:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    meta = model_service.metadata
    return ModelMetadataResponse(
        model_version=meta["model_version"],
        model_type=meta["model_type"],
        training_date=meta["training_date"],
        dataset=meta["dataset"],
        feature_names=meta["feature_names"],
        feature_count=meta["feature_count"],
        decision_threshold=meta["decision_threshold"],
        target_mapping=meta["target_mapping"],
        validation_metrics=meta["validation_metrics"],
        test_metrics=meta["test_metrics"],
        model_comparison=meta["model_comparison"],
        class_distribution=meta["class_distribution"],
        split=meta["split"],
        feature_importance=meta.get("feature_importance", []),
        confusion_matrix_test=meta.get("confusion_matrix_test", []),
        confusion_matrix_val=meta.get("confusion_matrix_val", []),
    )


@router.get("/analytics/model-performance")
async def get_model_performance():
    """Get detailed model performance metrics."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    meta = model_service.metadata
    return {
        "model_type": meta["model_type"],
        "model_version": meta["model_version"],
        "decision_threshold": meta["decision_threshold"],
        "validation_metrics": meta["validation_metrics"],
        "test_metrics": meta["test_metrics"],
        "model_comparison": meta["model_comparison"],
        "confusion_matrix_test": meta.get("confusion_matrix_test", []),
        "confusion_matrix_val": meta.get("confusion_matrix_val", []),
        "class_distribution": meta["class_distribution"],
        "split": meta["split"],
    }


@router.get("/analytics/feature-importance")
async def get_feature_importance():
    """Get feature importance data."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    return {
        "features": model_service.get_feature_importance(),
        "model_type": model_service.metadata["model_type"],
        "method": "permutation_importance",
    }
