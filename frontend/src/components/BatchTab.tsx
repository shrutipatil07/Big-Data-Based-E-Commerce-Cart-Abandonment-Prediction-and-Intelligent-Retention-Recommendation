import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Filter,
} from 'lucide-react'
import { BatchPredictionResult } from '../types'
import { uploadBatchCsv } from '../api'

export const BatchTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchPredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0]
      if (!dropped.name.endsWith('.csv')) {
        setError('Only CSV files are supported.')
        return
      }
      setFile(dropped)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const res = await uploadBatchCsv(file)
      setBatchResult(res)
    } catch (err: any) {
      setError(err.message || 'Batch prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const exportResultsToCsv = () => {
    if (!batchResult) return
    const headers = [
      'PredictionID',
      'PredictedLabel',
      'AbandonmentProbability',
      'RiskLevel',
      'RecommendedRetentionAction',
    ]
    const rows = batchResult.predictions.map((p) => [
      p.prediction_id,
      p.predicted_label,
      p.abandonment_probability,
      p.risk_level,
      `"${p.retention_recommendations[0]?.action || 'None'}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `cart_abandonment_predictions_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredPredictions = batchResult
    ? batchResult.predictions.filter((p) => {
        if (filterRisk === 'all') return true
        return p.risk_level.toLowerCase().includes(filterRisk)
      })
    : []

  const highRiskCount = batchResult
    ? batchResult.predictions.filter((p) => p.risk_level.toLowerCase().includes('high')).length
    : 0
  const abandonedCount = batchResult
    ? batchResult.predictions.filter((p) => p.predicted_label === 'Abandoned').length
    : 0

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            Batch Cart Abandonment Processor
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Upload raw e-commerce session feeds or test carts to score hundreds of records simultaneously.
          </p>
        </div>

        <a
          href="/sample_batch_input.csv"
          download="sample_batch_input.csv"
          className="btn btn-secondary btn-sm"
        >
          <Download size={14} /> Download Sample Template CSV
        </a>
      </div>

      {/* Upload Zone */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <UploadCloud size={48} color="#818cf8" style={{ margin: '0 auto 1rem auto' }} />
          <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>
            {file ? file.name : 'Choose a CSV file or drag and drop here'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Accepts standard clickstream telemetry feeds up to 10MB
          </div>
        </div>

        {file && (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <FileSpreadsheet size={18} color="#34d399" />
              <span>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? 'Processing Batch...' : 'Execute Model Inference'}
            </button>
          </div>
        )}

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
      </div>

      {/* Results View */}
      {batchResult && (
        <div className="glass-card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title">
                <CheckCircle size={20} color="#10b981" /> Batch Analysis Summary
              </h3>
              <div className="card-subtitle">
                Successfully processed {batchResult.successful} of {batchResult.total} records
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk Only</option>
                <option value="medium">Medium Risk Only</option>
                <option value="low">Low Risk Only</option>
              </select>

              <button className="btn btn-secondary btn-sm" onClick={exportResultsToCsv}>
                <Download size={14} /> Export Scored CSV
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div>
                <div className="stat-label">Total Carts Evaluated</div>
                <div className="stat-value">{batchResult.total}</div>
                <div className="stat-caption">Input batch size</div>
              </div>
            </div>

            <div className="stat-card risk-high">
              <div>
                <div className="stat-label">Predicted Abandonments</div>
                <div className="stat-value">
                  {abandonedCount} ({((abandonedCount / batchResult.total) * 100).toFixed(0)}%)
                </div>
                <div className="stat-caption">Target threshold triggered</div>
              </div>
            </div>

            <div className="stat-card risk-high">
              <div>
                <div className="stat-label">High Risk Urgent Carts</div>
                <div className="stat-value">{highRiskCount}</div>
                <div className="stat-caption">Require immediate exit-intent</div>
              </div>
            </div>
          </div>

          {/* Scored Results Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Prediction ID</th>
                  <th>Predicted Status</th>
                  <th>Abandonment Prob</th>
                  <th>Risk Tier</th>
                  <th>Automated Retention Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-dim)' }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8' }}>
                      {p.prediction_id}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: p.predicted_label === 'Abandoned' ? 'var(--risk-high)' : 'var(--risk-low)',
                        }}
                      >
                        {p.predicted_label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {(p.abandonment_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.risk_level.includes('High')
                            ? 'badge-high'
                            : p.risk_level.includes('Medium')
                            ? 'badge-medium'
                            : 'badge-low'
                        }`}
                      >
                        {p.risk_level}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {p.retention_recommendations[0]?.action || 'Standard Checkout Flow'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
