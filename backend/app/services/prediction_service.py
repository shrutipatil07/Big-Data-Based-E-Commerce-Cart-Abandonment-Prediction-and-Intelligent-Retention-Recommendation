import uuid
from datetime import datetime, timezone
from app.services.model_service import model_service
from app.services.recommendation_service import generate_recommendations
from app.config import RISK_LEVELS
from app.database import save_prediction


def classify_risk(probability: float) -> tuple:
    """Classify risk level based on probability."""
    for level_name in ["high", "medium", "low"]:
        level = RISK_LEVELS[level_name]
        if probability >= level["min"]:
            return level["label"], level["color"]
    return "Low Risk", "#22c55e"


def get_top_features(input_data: dict) -> list:
    """Get top contributing features for a prediction."""
    importance = model_service.get_feature_importance()
    top = []
    for fi in importance[:5]:
        feat = fi["feature"]
        val = input_data.get(feat, 0)
        imp = fi.get("mean_abs_shap", fi.get("builtin_importance", 0))
        direction = "increases" if imp > 0 else "neutral"
        top.append({
            "feature": feat,
            "importance": round(abs(imp), 4),
            "direction": direction,
        })
    return top


def make_prediction(input_data: dict) -> dict:
    """Run a full prediction with risk classification and recommendations."""
    result = model_service.predict(input_data)

    risk_label, risk_color = classify_risk(result["abandonment_probability"])
    top_features = get_top_features(input_data)
    recommendations = generate_recommendations(
        result["abandonment_probability"], risk_label, input_data
    )

    prediction_id = str(uuid.uuid4())[:12]
    timestamp = datetime.now(timezone.utc).isoformat()

    prediction = {
        "prediction_id": prediction_id,
        "predicted_class": result["predicted_class"],
        "predicted_label": result["predicted_label"],
        "abandonment_probability": result["abandonment_probability"],
        "risk_level": risk_label,
        "risk_color": risk_color,
        "decision_threshold": result["decision_threshold"],
        "model_version": result["model_version"],
        "top_contributing_features": top_features,
        "retention_recommendations": recommendations,
        "prediction_timestamp": timestamp,
    }

    # Save to database
    try:
        save_prediction({
            "prediction_id": prediction_id,
            "predicted_class": result["predicted_class"],
            "predicted_label": result["predicted_label"],
            "abandonment_probability": result["abandonment_probability"],
            "risk_level": risk_label,
            "model_version": result["model_version"],
            "retention_action": recommendations[0]["action"] if recommendations else "",
            "input_summary": f"views={input_data.get('session_views',0)},duration={input_data.get('session_duration_sec',0):.0f}s",
            "prediction_timestamp": timestamp,
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to save prediction: {e}")

    return prediction
