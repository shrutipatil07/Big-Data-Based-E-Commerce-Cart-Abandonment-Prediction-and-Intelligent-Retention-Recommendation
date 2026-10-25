import {
  HealthStatus,
  PredictionInput,
  PredictionResult,
  BatchPredictionResult,
  HistoryItem,
  ModelMetadata,
  FeatureImportanceItem,
  AnalyticsOverview,
} from './types'

const BASE_URL = ''

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`)
  return res.json()
}

export async function predictSingle(input: PredictionInput): Promise<PredictionResult> {
  const res = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Prediction failed')
  }
  return res.json()
}

export async function uploadBatchCsv(file: File): Promise<BatchPredictionResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/predict/csv`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'CSV upload failed')
  }
  return res.json()
}

export async function fetchPredictionHistory(page = 1, pageSize = 20, riskLevel?: string): Promise<{ total: number; items: HistoryItem[] }> {
  let url = `${BASE_URL}/api/predictions/history?page=${page}&page_size=${pageSize}`
  if (riskLevel && riskLevel !== 'all') {
    url += `&risk_level=${encodeURIComponent(riskLevel)}`
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function fetchModelMetadata(): Promise<ModelMetadata> {
  const res = await fetch(`${BASE_URL}/api/model/metadata`)
  if (!res.ok) throw new Error('Failed to fetch model metadata')
  return res.json()
}

export async function fetchFeatureImportance(): Promise<FeatureImportanceItem[]> {
  const res = await fetch(`${BASE_URL}/api/analytics/feature-importance`)
  if (!res.ok) throw new Error('Failed to fetch feature importance')
  const data = await res.json()
  if (Array.isArray(data)) return data
  if (data.features && Array.isArray(data.features)) {
    return data.features.map((f: any) => ({
      feature: f.feature,
      importance: f.builtin_importance !== undefined ? f.builtin_importance : Math.abs(f.mean_abs_shap || 0),
    }))
  }
  return []
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${BASE_URL}/api/analytics/overview`)
  if (!res.ok) throw new Error('Failed to fetch analytics overview')
  return res.json()
}
