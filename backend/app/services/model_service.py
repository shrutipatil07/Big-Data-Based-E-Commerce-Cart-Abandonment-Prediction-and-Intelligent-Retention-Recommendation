import joblib
import json
import numpy as np
import logging
from pathlib import Path
from app.config import MODEL_PATH, SCALER_PATH, METADATA_PATH, FEATURE_SCHEMA_PATH

logger = logging.getLogger(__name__)


class ModelService:
    """Loads and manages the ML model and its artifacts."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = None
        self.feature_schema = None
        self.is_loaded = False

    def load(self):
        """Load model artifacts from disk."""
        # Verify all files exist
        for path, name in [
            (MODEL_PATH, "model"), (SCALER_PATH, "scaler"), (METADATA_PATH, "metadata")
        ]:
            if not Path(path).exists():
                raise FileNotFoundError(
                    f"Missing artifact: {name} at {path}. "
                    f"Run the training notebook and place artifacts in the artifacts/ directory."
                )

        self.model = joblib.load(MODEL_PATH)
        logger.info(f"Model loaded from {MODEL_PATH}")

        self.scaler = joblib.load(SCALER_PATH)
        logger.info(f"Scaler loaded from {SCALER_PATH}")

        with open(METADATA_PATH, encoding='utf-8-sig') as f:
            self.metadata = json.load(f)
        logger.info(f"Metadata loaded: model_version={self.metadata['model_version']}")

        if Path(FEATURE_SCHEMA_PATH).exists():
            with open(FEATURE_SCHEMA_PATH, encoding='utf-8-sig') as f:
                self.feature_schema = json.load(f)

        # Verify feature count consistency
        expected_features = self.metadata["feature_names"]
        n_model_features = self.model.n_features_in_
        if n_model_features != len(expected_features):
            raise ValueError(
                f"Feature count mismatch: model expects {n_model_features}, "
                f"metadata lists {len(expected_features)}"
            )

        self.is_loaded = True
        logger.info("All model artifacts loaded and verified successfully.")

    def predict(self, features: dict) -> dict:
        """Run prediction on a single record."""
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        feature_names = self.metadata["feature_names"]
        feature_values = [features[f] for f in feature_names]
        X = np.array([feature_values])

        X_scaled = self.scaler.transform(X)
        probability = float(self.model.predict_proba(X_scaled)[0, 1])
        threshold = self.metadata["decision_threshold"]
        predicted_class = 1 if probability >= threshold else 0

        target_mapping = self.metadata["target_mapping"]
        predicted_label = target_mapping[str(predicted_class)]

        return {
            "predicted_class": predicted_class,
            "predicted_label": predicted_label,
            "abandonment_probability": round(probability, 4),
            "decision_threshold": threshold,
            "model_version": self.metadata["model_version"],
        }

    def predict_batch(self, records: list) -> list:
        """Run prediction on a batch of records."""
        if not self.is_loaded:
            raise RuntimeError("Model not loaded.")

        feature_names = self.metadata["feature_names"]
        X = np.array([[r[f] for f in feature_names] for r in records])
        X_scaled = self.scaler.transform(X)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        threshold = self.metadata["decision_threshold"]
        target_mapping = self.metadata["target_mapping"]

        results = []
        for prob in probabilities:
            pred_class = 1 if prob >= threshold else 0
            results.append({
                "predicted_class": pred_class,
                "predicted_label": target_mapping[str(pred_class)],
                "abandonment_probability": round(float(prob), 4),
                "decision_threshold": threshold,
                "model_version": self.metadata["model_version"],
            })
        return results

    def get_feature_importance(self) -> list:
        """Get feature importance from metadata."""
        return self.metadata.get("feature_importance", [])


# Singleton
model_service = ModelService()
