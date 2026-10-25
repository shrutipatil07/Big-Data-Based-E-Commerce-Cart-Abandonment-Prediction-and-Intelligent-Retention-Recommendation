import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["database_connected"] is True

def test_model_metadata():
    response = client.get("/api/model/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == "1.0.0"
    assert "metrics" in data
    assert "accuracy" in data["metrics"]

def test_single_prediction_valid():
    payload = {
        "session_duration_sec": 720.0,
        "session_views": 8,
        "session_addtocarts": 1,
        "session_unique_items": 1,
        "hist_views": 35,
        "hist_addtocarts": 4,
        "hist_transactions": 0,
        "hist_unique_items": 3,
        "hist_conversion_rate": 0.0,
        "categoryid": 450,
        "parent_categoryid": 120,
        "num_available_properties": 4
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction_id" in data
    assert "abandonment_probability" in data
    assert "risk_level" in data
    assert len(data["retention_recommendations"]) > 0

def test_single_prediction_invalid():
    # Missing required fields
    response = client.post("/api/predict", json={"session_views": 2})
    assert response.status_code == 422

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_predictions" in data
    assert "abandonment_rate" in data

def test_prediction_history():
    response = client.get("/api/predictions/history?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
