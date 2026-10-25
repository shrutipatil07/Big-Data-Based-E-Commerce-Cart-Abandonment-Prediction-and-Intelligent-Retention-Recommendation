import joblib, json, os, numpy as np, pandas as pd
from sklearn.inspection import permutation_importance

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'artifacts')
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'processed', 'model_ready_dataset.parquet')

model = joblib.load(os.path.join(ARTIFACTS_DIR, 'model.joblib'))
scaler = joblib.load(os.path.join(ARTIFACTS_DIR, 'scaler.joblib'))

df = pd.read_parquet(DATASET_PATH)
df = df.sort_values('prediction_timestamp').reset_index(drop=True)
FEATURE_COLS = ['hist_views','hist_addtocarts','hist_transactions','hist_unique_items','session_views','session_addtocarts','session_unique_items','session_duration_sec','hist_conversion_rate','categoryid','parent_categoryid','num_available_properties']

n = len(df)
train_end = int(n * 0.60)
val_end = int(n * 0.80)
X_val = df.iloc[train_end:val_end][FEATURE_COLS]
y_val = df.iloc[train_end:val_end]['label']
X_val_s = scaler.transform(X_val)

# Use RF built-in feature importance + permutation importance
print("Computing feature importance...")
# 1. Built-in (impurity-based)
builtin_imp = model.feature_importances_
# 2. Permutation importance (more reliable)
perm_result = permutation_importance(model, X_val_s, y_val, n_repeats=10, random_state=42, scoring='f1')
perm_imp = perm_result.importances_mean

# Combine: use permutation importance as primary
importance = []
for i, f in enumerate(FEATURE_COLS):
    importance.append({
        'feature': f,
        'mean_abs_shap': round(float(perm_imp[i]), 6),
        'builtin_importance': round(float(builtin_imp[i]), 6)
    })
importance.sort(key=lambda x: -x['mean_abs_shap'])

# Update metadata
meta_path = os.path.join(ARTIFACTS_DIR, 'model_metadata.json')
with open(meta_path) as f:
    meta = json.load(f)
meta['feature_importance'] = importance
with open(meta_path, 'w') as f:
    json.dump(meta, f, indent=2)

print("Feature importance (permutation-based):")
for fi in importance:
    print(f"  {fi['feature']:28s} perm={fi['mean_abs_shap']:.6f}  builtin={fi['builtin_importance']:.6f}")
print("Done!")
