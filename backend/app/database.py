import sqlite3
import os
from datetime import datetime
from app.config import PROJECT_ROOT

DB_PATH = os.path.join(PROJECT_ROOT, "backend", "predictions.db")


def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Initialize the database tables."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_id TEXT UNIQUE NOT NULL,
            predicted_class INTEGER NOT NULL,
            predicted_label TEXT NOT NULL,
            abandonment_probability REAL NOT NULL,
            risk_level TEXT NOT NULL,
            model_version TEXT NOT NULL,
            retention_action TEXT DEFAULT '',
            input_summary TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON predictions(risk_level)
    """)
    conn.commit()
    conn.close()


def save_prediction(prediction_data: dict):
    """Save a prediction record."""
    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO predictions (prediction_id, predicted_class, predicted_label,
                abandonment_probability, risk_level, model_version, retention_action, input_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prediction_data["prediction_id"],
            prediction_data["predicted_class"],
            prediction_data["predicted_label"],
            prediction_data["abandonment_probability"],
            prediction_data["risk_level"],
            prediction_data["model_version"],
            prediction_data.get("retention_action", ""),
            prediction_data.get("input_summary", ""),
            prediction_data["prediction_timestamp"],
        ))
        conn.commit()
    finally:
        conn.close()


def get_prediction_history(page: int = 1, page_size: int = 20, risk_level: str = None):
    """Get prediction history with pagination."""
    conn = get_db()
    try:
        offset = (page - 1) * page_size

        where = ""
        params = []
        if risk_level:
            where = "WHERE risk_level = ?"
            params.append(risk_level)

        count_row = conn.execute(f"SELECT COUNT(*) as c FROM predictions {where}", params).fetchone()
        total = count_row["c"]

        rows = conn.execute(
            f"SELECT * FROM predictions {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset]
        ).fetchall()

        return total, [dict(r) for r in rows]
    finally:
        conn.close()


def get_analytics_data():
    """Get aggregate analytics."""
    conn = get_db()
    try:
        total = conn.execute("SELECT COUNT(*) as c FROM predictions").fetchone()["c"]

        risk_counts = {}
        for row in conn.execute("SELECT risk_level, COUNT(*) as c FROM predictions GROUP BY risk_level"):
            risk_counts[row["risk_level"]] = row["c"]

        avg_prob = conn.execute("SELECT AVG(abandonment_probability) as a FROM predictions").fetchone()["a"] or 0

        recent = conn.execute(
            "SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10"
        ).fetchall()

        # Probability distribution (buckets)
        prob_dist = []
        for row in conn.execute("""
            SELECT
                CASE
                    WHEN abandonment_probability < 0.1 THEN '0.0-0.1'
                    WHEN abandonment_probability < 0.2 THEN '0.1-0.2'
                    WHEN abandonment_probability < 0.3 THEN '0.2-0.3'
                    WHEN abandonment_probability < 0.4 THEN '0.3-0.4'
                    WHEN abandonment_probability < 0.5 THEN '0.4-0.5'
                    WHEN abandonment_probability < 0.6 THEN '0.5-0.6'
                    WHEN abandonment_probability < 0.7 THEN '0.6-0.7'
                    WHEN abandonment_probability < 0.8 THEN '0.7-0.8'
                    WHEN abandonment_probability < 0.9 THEN '0.8-0.9'
                    ELSE '0.9-1.0'
                END as bucket,
                COUNT(*) as count
            FROM predictions GROUP BY bucket ORDER BY bucket
        """):
            prob_dist.append({"range": row["bucket"], "count": row["count"]})

        # Daily predictions
        daily = []
        for row in conn.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM predictions GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30
        """):
            daily.append({"date": row["date"], "count": row["count"]})

        return {
            "total": total,
            "risk_counts": risk_counts,
            "avg_prob": avg_prob,
            "recent": [dict(r) for r in recent],
            "prob_dist": prob_dist,
            "daily": daily
        }
    finally:
        conn.close()
