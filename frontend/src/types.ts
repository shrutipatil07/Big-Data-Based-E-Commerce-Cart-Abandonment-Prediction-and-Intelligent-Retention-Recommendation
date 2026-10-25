export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_version: string;
  database_connected: boolean;
  timestamp: string;
}

export interface PredictionInput {
  hist_views: number;
  hist_addtocarts: number;
  hist_transactions: number;
  hist_unique_items: number;
  session_views: number;
  session_addtocarts: number;
  session_unique_items: number;
  session_duration_sec: number;
  hist_conversion_rate: number;
  categoryid: number;
  parent_categoryid: number;
  num_available_properties: number;
}

export interface FeatureContribution {
  feature: string;
  importance: number;
  direction: string;
}

export interface RetentionRecommendation {
  action: string;
  reason: string;
  priority: string;
}

export interface PredictionResult {
  prediction_id: string;
  predicted_class: number;
  predicted_label: string;
  abandonment_probability: number;
  risk_level: string;
  risk_color: string;
  decision_threshold: number;
  model_version: string;
  top_contributing_features: FeatureContribution[];
  retention_recommendations: RetentionRecommendation[];
  prediction_timestamp: string;
}

export interface BatchPredictionResult {
  total: number;
  successful: number;
  failed: number;
  predictions: PredictionResult[];
  errors: { index: number; error: string }[];
}

export interface HistoryItem {
  id: number;
  prediction_id: string;
  predicted_class: number;
  predicted_label: string;
  abandonment_probability: number;
  risk_level: string;
  model_version: string;
  retention_action: string;
  created_at: string;
}

export interface ModelMetadata {
  model_version: string;
  model_type: string;
  training_date: string;
  dataset: string;
  feature_count: number;
  decision_threshold: number;
  test_metrics: {
    roc_auc: number;
    precision: number;
    recall: number;
    f1: number;
    pr_auc?: number;
  };
  validation_metrics?: {
    roc_auc: number;
    precision: number;
    recall: number;
    f1: number;
  };
  confusion_matrix_test: number[][];
  model_comparison?: Record<string, any>;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface AnalyticsOverview {
  total_predictions: number;
  abandonment_rate: number;
  avg_risk_probability: number;
  risk_distribution: {
    high: number;
    medium: number;
    low: number;
  };
}
