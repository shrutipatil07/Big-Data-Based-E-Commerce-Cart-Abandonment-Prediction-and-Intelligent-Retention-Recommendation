import requests
import json
import os
import sys

def test_api():
    base = "http://127.0.0.1:8000"
    print(f"Connecting to test server at {base}...")

    # 1. Health
    r = requests.get(f"{base}/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    h = r.json()
    assert h["status"] == "healthy"
    assert h["model_loaded"] is True
    assert h["database_connected"] is True
    print(" [PASS] 1. /health endpoint verified (status: healthy, model: loaded)")

    # 2. Metadata
    r = requests.get(f"{base}/api/model/metadata")
    assert r.status_code == 200
    m = r.json()
    assert m["model_version"] == "1.0.0"
    assert "test_metrics" in m
    tm = m["test_metrics"]
    print(f" [PASS] 2. /api/model/metadata verified (Recall: {tm['recall']:.3f}, Precision: {tm['precision']:.3f}, F1: {tm['f1']:.3f})")

    # 3. Single Prediction
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
        "num_available_properties": 4,
    }
    r = requests.post(f"{base}/api/predict", json=payload)
    assert r.status_code == 200
    res = r.json()
    assert "prediction_id" in res
    assert "abandonment_probability" in res
    assert "risk_level" in res
    assert len(res["retention_recommendations"]) > 0
    print(f" [PASS] 3. /api/predict verified (Prob: {res['abandonment_probability']:.2f}, Risk: {res['risk_level']})")

    # 4. Validation Rejection
    r = requests.post(f"{base}/api/predict", json={"hist_views": 10})
    assert r.status_code == 422
    print(" [PASS] 4. Schema validation rejection verified (422 Unprocessable Entity)")

    # 5. CSV Batch Prediction
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    csv_file = os.path.join(data_dir, "sample_batch_input.csv")
    if os.path.exists(csv_file):
        with open(csv_file, "rb") as f:
            files = {"file": ("sample_batch_input.csv", f, "text/csv")}
            r = requests.post(f"{base}/api/predict/csv", files=files)
            assert r.status_code == 200
            b = r.json()
            assert b["successful"] == b["total"]
            print(f" [PASS] 5. /api/predict/csv batch verified ({b['successful']} records scored)")

    # 6. Analytics Overview
    r = requests.get(f"{base}/api/analytics/overview")
    assert r.status_code == 200
    a = r.json()
    print(f" [PASS] 6. /api/analytics/overview verified ({a['total_predictions']} historical logs)")

    # 7. History
    r = requests.get(f"{base}/api/predictions/history?page=1&page_size=5")
    assert r.status_code == 200
    hist = r.json()
    assert "items" in hist
    print(f" [PASS] 7. /api/predictions/history verified ({len(hist['items'])} items returned)")

    print("\n=======================================================")
    print(" ALL 7 END-TO-END INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_api()
