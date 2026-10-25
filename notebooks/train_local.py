import pandas as pd
import numpy as np
import json
import joblib
import os
import warnings
from datetime import datetime

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_curve, auc, f1_score, precision_score,
    recall_score, average_precision_score
)
import sklearn
import xgboost

warnings.filterwarnings('ignore')
np.random.seed(42)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(PROJECT_ROOT, 'data', 'processed', 'model_ready_dataset.parquet')
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, 'artifacts')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

print("=== Cart Abandonment Model Training ===\n")

# 1. Load dataset
df = pd.read_parquet(DATASET_PATH)
print(f"Dataset loaded: {df.shape}")

# 2. Config
TARGET_COL = 'label'
FEATURE_COLS = [
    'hist_views', 'hist_addtocarts', 'hist_transactions', 'hist_unique_items',
    'session_views', 'session_addtocarts', 'session_unique_items',
    'session_duration_sec', 'hist_conversion_rate',
    'categoryid', 'parent_categoryid', 'num_available_properties'
]

# Validate
assert set(FEATURE_COLS).issubset(set(df.columns)), "Missing feature columns!"
assert TARGET_COL in df.columns, "Missing target column!"
assert df[FEATURE_COLS + [TARGET_COL]].isnull().sum().sum() == 0, "NaN found!"

label_dist = df[TARGET_COL].value_counts()
print(f"Label dist: Abandoned={label_dist[1]}, Converted={label_dist[0]}")

# 3. Chronological split 60/20/20
df = df.sort_values('prediction_timestamp').reset_index(drop=True)
n = len(df)
train_end = int(n * 0.60)
val_end = int(n * 0.80)

X_train = df.iloc[:train_end][FEATURE_COLS]
y_train = df.iloc[:train_end][TARGET_COL]
X_val = df.iloc[train_end:val_end][FEATURE_COLS]
y_val = df.iloc[train_end:val_end][TARGET_COL]
X_test = df.iloc[val_end:][FEATURE_COLS]
y_test = df.iloc[val_end:][TARGET_COL]

print(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
print(f"Train label=1: {y_train.mean()*100:.1f}% | Val: {y_val.mean()*100:.1f}% | Test: {y_test.mean()*100:.1f}%")

# 4. Scale
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s = scaler.transform(X_val)
X_test_s = scaler.transform(X_test)

# 5. Train models
models = {
    'Logistic Regression': LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42, n_jobs=-1, max_depth=15, min_samples_leaf=5),
    'XGBoost': XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, scale_pos_weight=y_train.value_counts()[0]/y_train.value_counts()[1], random_state=42, eval_metric='logloss', n_jobs=-1)
}

results = {}
trained_models = {}

for name, model in models.items():
    print(f"\nTraining {name}...")
    model.fit(X_train_s, y_train)
    trained_models[name] = model
    y_val_prob = model.predict_proba(X_val_s)[:, 1]
    y_val_pred = (y_val_prob >= 0.5).astype(int)
    roc = roc_auc_score(y_val, y_val_prob)
    pr = average_precision_score(y_val, y_val_prob)
    f1 = f1_score(y_val, y_val_pred)
    prec = precision_score(y_val, y_val_pred)
    rec = recall_score(y_val, y_val_pred)
    results[name] = {'roc_auc': roc, 'pr_auc': pr, 'f1': f1, 'precision': prec, 'recall': rec, 'y_val_prob': y_val_prob}
    print(f"  ROC-AUC={roc:.4f}  PR-AUC={pr:.4f}  F1={f1:.4f}  Prec={prec:.4f}  Rec={rec:.4f}")

# 6. Select best by PR-AUC
best_name = max(results, key=lambda k: results[k]['pr_auc'])
best_model = trained_models[best_name]
print(f"\nBest model: {best_name} (PR-AUC={results[best_name]['pr_auc']:.4f})")

# 7. Optimize threshold on validation
y_val_prob = results[best_name]['y_val_prob']
thresholds = np.arange(0.1, 0.9, 0.01)
f1_scores = [f1_score(y_val, (y_val_prob >= t).astype(int)) for t in thresholds]
best_threshold = float(thresholds[np.argmax(f1_scores)])
print(f"Optimal threshold: {best_threshold:.2f} (F1={max(f1_scores):.4f})")

# Validation at optimal threshold
y_val_opt = (y_val_prob >= best_threshold).astype(int)
cm_val = confusion_matrix(y_val, y_val_opt)
print(f"\nValidation confusion matrix (threshold={best_threshold:.2f}):")
print(cm_val)
print(classification_report(y_val, y_val_opt, target_names=['Converted', 'Abandoned']))

# 8. Test evaluation
y_test_prob = best_model.predict_proba(X_test_s)[:, 1]
y_test_pred = (y_test_prob >= best_threshold).astype(int)
test_roc = roc_auc_score(y_test, y_test_prob)
test_pr = average_precision_score(y_test, y_test_prob)
test_f1 = f1_score(y_test, y_test_pred)
test_prec = precision_score(y_test, y_test_pred)
test_rec = recall_score(y_test, y_test_pred)
cm_test = confusion_matrix(y_test, y_test_pred)

print(f"\n=== FINAL TEST RESULTS ===")
print(f"ROC-AUC={test_roc:.4f}  PR-AUC={test_pr:.4f}  F1={test_f1:.4f}  Prec={test_prec:.4f}  Rec={test_rec:.4f}")
print(cm_test)
print(classification_report(y_test, y_test_pred, target_names=['Converted', 'Abandoned']))

# 9. SHAP
print("\nComputing SHAP values...")
try:
    import shap
    if best_name in ('XGBoost', 'Random Forest'):
        explainer = shap.TreeExplainer(best_model)
        shap_values = explainer.shap_values(X_val_s)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
    else:
        explainer = shap.LinearExplainer(best_model, X_train_s[:200])
        shap_values = explainer.shap_values(X_val_s)
    feature_importance = [{"feature": f, "mean_abs_shap": round(float(v), 6)} for f, v in sorted(zip(FEATURE_COLS, np.abs(shap_values).mean(axis=0)), key=lambda x: -x[1])]
    print("SHAP computed successfully.")
    for fi in feature_importance:
        print(f"  {fi['feature']:<28} {fi['mean_abs_shap']:.6f}")
except Exception as e:
    print(f"SHAP failed: {e}")
    feature_importance = [{"feature": f, "mean_abs_shap": round(float(v), 6)} for f, v in zip(FEATURE_COLS, np.zeros(len(FEATURE_COLS)))]

# 10. Save artifacts
joblib.dump(best_model, os.path.join(ARTIFACTS_DIR, 'model.joblib'))
joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, 'scaler.joblib'))

# Temporal info
df_train = df.iloc[:train_end]
df_val_df = df.iloc[train_end:val_end]
df_test_df = df.iloc[val_end:]

manifest = {
    "model_version": "1.0.0",
    "model_type": best_name,
    "training_date": datetime.utcnow().isoformat() + "Z",
    "dataset": "RetailRocket",
    "total_samples": int(n),
    "split": {
        "method": "chronological",
        "train_size": int(len(X_train)),
        "val_size": int(len(X_val)),
        "test_size": int(len(X_test)),
        "train_period": f"{pd.to_datetime(df_train['prediction_timestamp'].min(), unit='ms')} to {pd.to_datetime(df_train['prediction_timestamp'].max(), unit='ms')}",
        "val_period": f"{pd.to_datetime(df_val_df['prediction_timestamp'].min(), unit='ms')} to {pd.to_datetime(df_val_df['prediction_timestamp'].max(), unit='ms')}",
        "test_period": f"{pd.to_datetime(df_test_df['prediction_timestamp'].min(), unit='ms')} to {pd.to_datetime(df_test_df['prediction_timestamp'].max(), unit='ms')}"
    },
    "class_distribution": {"Abandoned": int(label_dist[1]), "Converted": int(label_dist[0])},
    "decision_threshold": best_threshold,
    "feature_names": FEATURE_COLS,
    "feature_count": len(FEATURE_COLS),
    "target_column": TARGET_COL,
    "target_mapping": {"0": "Converted", "1": "Abandoned"},
    "validation_metrics": {
        "roc_auc": round(float(results[best_name]['roc_auc']), 4),
        "pr_auc": round(float(results[best_name]['pr_auc']), 4),
        "f1": round(float(results[best_name]['f1']), 4),
        "precision": round(float(results[best_name]['precision']), 4),
        "recall": round(float(results[best_name]['recall']), 4)
    },
    "test_metrics": {
        "roc_auc": round(float(test_roc), 4),
        "pr_auc": round(float(test_pr), 4),
        "f1": round(float(test_f1), 4),
        "precision": round(float(test_prec), 4),
        "recall": round(float(test_rec), 4)
    },
    "model_comparison": {
        name: {k: round(float(v), 4) for k, v in r.items() if k != 'y_val_prob'}
        for name, r in results.items()
    },
    "feature_importance": feature_importance,
    "confusion_matrix_test": cm_test.tolist(),
    "confusion_matrix_val": cm_val.tolist(),
    "package_versions": {
        "python": str(pd.__version__),
        "scikit-learn": sklearn.__version__,
        "xgboost": xgboost.__version__,
        "pandas": pd.__version__,
        "numpy": np.__version__
    }
}

with open(os.path.join(ARTIFACTS_DIR, 'model_metadata.json'), 'w') as f:
    json.dump(manifest, f, indent=2)

print(f"\n=== Artifacts saved to {ARTIFACTS_DIR} ===")
for fn in sorted(os.listdir(ARTIFACTS_DIR)):
    fp = os.path.join(ARTIFACTS_DIR, fn)
    print(f"  {fn}: {os.path.getsize(fp)/1024:.1f} KB")
print("\nDONE!")
