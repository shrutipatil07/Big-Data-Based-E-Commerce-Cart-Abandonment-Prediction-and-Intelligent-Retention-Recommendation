import React, { useState } from 'react'
import {
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Copy,
  Tag,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react'
import { PredictionInput, PredictionResult } from '../types'
import { predictSingle } from '../api'

const PRESETS: { name: string; desc: string; values: PredictionInput }[] = [
  {
    name: 'Hesitant Browser',
    desc: 'Long session, 0 past transactions, high views',
    values: {
      session_duration_sec: 750,
      session_views: 8,
      session_addtocarts: 1,
      session_unique_items: 1,
      hist_views: 32,
      hist_addtocarts: 3,
      hist_transactions: 0,
      hist_unique_items: 2,
      hist_conversion_rate: 0.0,
      categoryid: 450,
      parent_categoryid: 120,
      num_available_properties: 4,
    },
  },
  {
    name: 'Loyal Repeat Buyer',
    desc: 'High conversion rate, decisive rapid checkout',
    values: {
      session_duration_sec: 85,
      session_views: 2,
      session_addtocarts: 1,
      session_unique_items: 1,
      hist_views: 14,
      hist_addtocarts: 3,
      hist_transactions: 3,
      hist_unique_items: 2,
      hist_conversion_rate: 1.0,
      categoryid: 210,
      parent_categoryid: 85,
      num_available_properties: 8,
    },
  },
  {
    name: 'Impulsive Window Shopper',
    desc: 'Many items added quickly, high views, 0 past purchases',
    values: {
      session_duration_sec: 920,
      session_views: 15,
      session_addtocarts: 3,
      session_unique_items: 3,
      hist_views: 55,
      hist_addtocarts: 6,
      hist_transactions: 0,
      hist_unique_items: 5,
      hist_conversion_rate: 0.0,
      categoryid: 112,
      parent_categoryid: 40,
      num_available_properties: 2,
    },
  },
  {
    name: 'Returning Bargain Hunter',
    desc: 'Moderate views, 1 past transaction, moderate session',
    values: {
      session_duration_sec: 290,
      session_views: 5,
      session_addtocarts: 1,
      session_unique_items: 1,
      hist_views: 18,
      hist_addtocarts: 2,
      hist_transactions: 1,
      hist_unique_items: 2,
      hist_conversion_rate: 0.5,
      categoryid: 780,
      parent_categoryid: 200,
      num_available_properties: 5,
    },
  },
]

export const PredictorTab: React.FC = () => {
  const [formData, setFormData] = useState<PredictionInput>(PRESETS[0].values)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleInputChange = (field: keyof PredictionInput, val: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val }
      // Recalculate hist_conversion_rate automatically if transactions or addtocarts change
      if (field === 'hist_transactions' || field === 'hist_addtocarts') {
        const trans = field === 'hist_transactions' ? val : updated.hist_transactions
        const carts = field === 'hist_addtocarts' ? Math.max(1, val) : Math.max(1, updated.hist_addtocarts)
        updated.hist_conversion_rate = Math.min(1.0, Math.round((trans / carts) * 1000) / 1000)
      }
      return updated
    })
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(preset.values)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await predictSingle(formData)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Prediction request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAction = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate SVG arc for gauge
  const prob = result ? result.abandonment_probability : 0.65
  const strokeDashoffset = 314 - 314 * prob // 314 is circumference of radius 100 semi-arc (pi * r)

  const getGaugeColor = (p: number) => {
    if (p >= 0.7) return 'var(--risk-high)'
    if (p >= 0.4) return 'var(--risk-medium)'
    return 'var(--risk-low)'
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
          Real-Time Cart Abandonment Risk Predictor
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Simulate a shopper session and let the machine learning model compute abandonment likelihood & retention actions.
        </p>
      </div>

      {/* Preset Personas */}
      <div className="presets-bar">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', alignSelf: 'center', fontWeight: 600 }}>
          LOAD PERSONA:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            className="preset-chip"
            onClick={() => applyPreset(p)}
            title={p.desc}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid-2col">
        {/* Left Column: Input Form */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Session & Telemetry Parameters</h3>
              <div className="card-subtitle">Values fed into the normalized feature vector</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Session Duration */}
            <div className="form-group">
              <div className="form-label">
                <span>Active Session Duration</span>
                <span className="form-label-val">
                  {Math.floor(formData.session_duration_sec / 60)}m {Math.round(formData.session_duration_sec % 60)}s ({formData.session_duration_sec}s)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1800"
                step="10"
                className="range-slider"
                value={formData.session_duration_sec}
                onChange={(e) => handleInputChange('session_duration_sec', parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Session Views</span>
                  <span className="form-label-val">{formData.session_views}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={formData.session_views}
                  onChange={(e) => handleInputChange('session_views', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Session Add-To-Carts</span>
                  <span className="form-label-val">{formData.session_addtocarts}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="form-input"
                  value={formData.session_addtocarts}
                  onChange={(e) => handleInputChange('session_addtocarts', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Historical Views</span>
                  <span className="form-label-val">{formData.hist_views}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="500"
                  className="form-input"
                  value={formData.hist_views}
                  onChange={(e) => handleInputChange('hist_views', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Past Completed Orders</span>
                  <span className="form-label-val">{formData.hist_transactions}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="form-input"
                  value={formData.hist_transactions}
                  onChange={(e) => handleInputChange('hist_transactions', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Historical Add-To-Carts</span>
                  <span className="form-label-val">{formData.hist_addtocarts}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={formData.hist_addtocarts}
                  onChange={(e) => handleInputChange('hist_addtocarts', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Conversion Rate</span>
                  <span className="form-label-val">{(formData.hist_conversion_rate * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  className="form-input"
                  value={formData.hist_conversion_rate}
                  onChange={(e) => handleInputChange('hist_conversion_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Category ID</span>
                </div>
                <input
                  type="number"
                  className="form-input"
                  value={formData.categoryid}
                  onChange={(e) => handleInputChange('categoryid', parseInt(e.target.value) || -1)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Parent Cat ID</span>
                </div>
                <input
                  type="number"
                  className="form-input"
                  value={formData.parent_categoryid}
                  onChange={(e) => handleInputChange('parent_categoryid', parseInt(e.target.value) || -1)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Item Properties</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="form-input"
                  value={formData.num_available_properties}
                  onChange={(e) => handleInputChange('num_available_properties', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? (
                  <>Computing Risk Vector...</>
                ) : (
                  <>
                    <Sparkles size={16} /> Predict Cart Abandonment
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData(PRESETS[0].values)}
                title="Reset Form"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--risk-high-bg)',
                  color: 'var(--risk-high)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Prediction Results & Retention Recommendations */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Model Risk Assessment</h3>
              <div className="card-subtitle">Real-time inference & automated intervention</div>
            </div>
            {result && (
              <span
                className={`badge ${
                  result.risk_level.includes('High')
                    ? 'badge-high'
                    : result.risk_level.includes('Medium')
                    ? 'badge-medium'
                    : 'badge-low'
                }`}
              >
                {result.risk_level}
              </span>
            )}
          </div>

          {!result ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles size={40} color="#818cf8" style={{ margin: '0 auto 1rem auto', opacity: 0.6 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
                Ready to Predict
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', maxWidth: '300px', margin: '0.3rem auto 0 auto' }}>
                Adjust the session parameters on the left or click a persona preset, then press Predict.
              </div>
            </div>
          ) : (
            <div>
              {/* Semi-circular Gauge */}
              <div className="gauge-container">
                <svg className="gauge-svg" viewBox="0 0 240 130">
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    className="gauge-bg"
                  />
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    className="gauge-meter"
                    style={{
                      stroke: getGaugeColor(result.abandonment_probability),
                      strokeDasharray: '314',
                      strokeDashoffset: strokeDashoffset,
                    }}
                  />
                </svg>
                <div className="gauge-value" style={{ color: getGaugeColor(result.abandonment_probability) }}>
                  {(result.abandonment_probability * 100).toFixed(1)}%
                </div>
                <div className="gauge-label">
                  Abandonment Probability (Threshold: {(result.decision_threshold * 100).toFixed(0)}%)
                </div>

                <div
                  style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Classification:</span>
                  <span
                    style={{
                      color:
                        result.predicted_label === 'Abandoned'
                          ? 'var(--risk-high)'
                          : 'var(--risk-low)',
                    }}
                  >
                    {result.predicted_label === 'Abandoned' ? '⚠️ At-Risk of Abandonment' : '✅ Likely to Convert'}
                  </span>
                </div>
              </div>

              {/* Top Contributing Behavioral Features */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dominant Behavioral Drivers
                </div>
                <div className="feat-bar-container">
                  {result.top_contributing_features.slice(0, 4).map((f, i) => (
                    <div key={i} className="feat-item">
                      <div className="feat-meta">
                        <span className="feat-name">{f.feature}</span>
                        <span className="feat-val">
                          {f.direction === 'increases' ? '🔺 Increases Risk' : '🔻 Lowers Risk'}
                        </span>
                      </div>
                      <div className="feat-track">
                        <div
                          className="feat-fill"
                          style={{
                            width: `${Math.min(100, Math.max(10, f.importance * 400))}%`,
                            background:
                              f.direction === 'increases'
                                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                : 'linear-gradient(90deg, #10b981, #06b6d4)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Retention Action */}
              {result.retention_recommendations.length > 0 && (
                <div className="retention-card">
                  <div className="retention-header">
                    <div className="retention-title">
                      <Tag size={16} /> Automated Retention Prescription
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(99, 102, 241, 0.25)',
                        color: '#c7d2fe',
                      }}
                    >
                      {result.retention_recommendations[0].priority} priority
                    </span>
                  </div>

                  <div className="retention-text">
                    <strong>Action:</strong> {result.retention_recommendations[0].action}
                  </div>

                  <div className="retention-reason">
                    <strong>Why:</strong> {result.retention_recommendations[0].reason}
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyAction(result.retention_recommendations[0].action)}
                    >
                      <Copy size={13} /> {copied ? 'Copied!' : 'Copy Retention Action'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
