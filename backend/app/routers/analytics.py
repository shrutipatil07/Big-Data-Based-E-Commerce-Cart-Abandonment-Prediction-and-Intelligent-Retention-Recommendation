from fastapi import APIRouter
from app.schemas import AnalyticsOverview, PredictionHistoryItem
from app.database import get_analytics_data

router = APIRouter(tags=["analytics"])


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_overview():
    """Get dashboard analytics overview."""
    data = get_analytics_data()

    risk_counts = data["risk_counts"]
    total = data["total"]

    return {
        "total_predictions": total,
        "high_risk_count": risk_counts.get("High Risk", 0),
        "medium_risk_count": risk_counts.get("Medium Risk", 0),
        "low_risk_count": risk_counts.get("Low Risk", 0),
        "high_risk_pct": round(risk_counts.get("High Risk", 0) / max(total, 1) * 100, 1),
        "avg_abandonment_probability": round(data["avg_prob"], 4),
        "recent_predictions": [
            PredictionHistoryItem(
                id=r["id"],
                prediction_id=r["prediction_id"],
                predicted_class=r["predicted_class"],
                predicted_label=r["predicted_label"],
                abandonment_probability=r["abandonment_probability"],
                risk_level=r["risk_level"],
                model_version=r["model_version"],
                retention_action=r.get("retention_action", ""),
                created_at=r["created_at"],
            )
            for r in data["recent"]
        ],
        "probability_distribution": data["prob_dist"],
        "risk_distribution": [
            {"level": level, "count": risk_counts.get(level, 0)}
            for level in ["High Risk", "Medium Risk", "Low Risk"]
        ],
        "daily_predictions": data["daily"],
    }
