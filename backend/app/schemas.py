from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class PredictionInput(BaseModel):
    """Input for a single prediction request."""
    hist_views: int = Field(..., ge=0, description="Historical view count")
    hist_addtocarts: int = Field(..., ge=1, description="Historical add-to-cart count")
    hist_transactions: int = Field(..., ge=0, description="Historical transaction count")
    hist_unique_items: int = Field(..., ge=1, description="Historical unique items")
    session_views: int = Field(..., ge=0, description="Session view count")
    session_addtocarts: int = Field(..., ge=1, description="Session add-to-cart count")
    session_unique_items: int = Field(..., ge=1, description="Session unique items")
    session_duration_sec: float = Field(..., ge=0.0, description="Session duration in seconds")
    hist_conversion_rate: float = Field(..., ge=0.0, le=1.0, description="Historical conversion rate")
    categoryid: int = Field(default=-1, description="Category ID (-1 if unknown)")
    parent_categoryid: int = Field(default=-1, description="Parent category ID (-1 if unknown)")
    num_available_properties: int = Field(default=0, ge=0, description="Available item properties count")


class FeatureContribution(BaseModel):
    feature: str
    importance: float
    direction: str


class RetentionRecommendation(BaseModel):
    action: str
    reason: str
    priority: str


class PredictionResult(BaseModel):
    prediction_id: str
    predicted_class: int
    predicted_label: str
    abandonment_probability: float
    risk_level: str
    risk_color: str
    decision_threshold: float
    model_version: str
    top_contributing_features: List[FeatureContribution]
    retention_recommendations: List[RetentionRecommendation]
    prediction_timestamp: str


class BatchPredictionInput(BaseModel):
    records: List[PredictionInput] = Field(..., max_length=500)


class BatchPredictionResult(BaseModel):
    total: int
    successful: int
    failed: int
    predictions: List[PredictionResult]
    errors: List[dict]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str]
    database_connected: bool
    timestamp: str


class ModelMetadataResponse(BaseModel):
    model_version: str
    model_type: str
    training_date: str
    dataset: str
    feature_names: List[str]
    feature_count: int
    decision_threshold: float
    target_mapping: dict
    validation_metrics: dict
    test_metrics: dict
    model_comparison: dict
    class_distribution: dict
    split: dict
    feature_importance: List[dict]
    confusion_matrix_test: List[List[int]]
    confusion_matrix_val: List[List[int]]


class PredictionHistoryItem(BaseModel):
    id: int
    prediction_id: str
    predicted_class: int
    predicted_label: str
    abandonment_probability: float
    risk_level: str
    model_version: str
    retention_action: str
    created_at: str


class PredictionHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[PredictionHistoryItem]


class AnalyticsOverview(BaseModel):
    total_predictions: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    high_risk_pct: float
    avg_abandonment_probability: float
    recent_predictions: List[PredictionHistoryItem]
    probability_distribution: List[dict]
    risk_distribution: List[dict]
    daily_predictions: List[dict]
