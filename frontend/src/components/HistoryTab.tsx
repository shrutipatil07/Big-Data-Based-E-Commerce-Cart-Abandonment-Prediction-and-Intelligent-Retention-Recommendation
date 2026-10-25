import React, { useEffect, useState } from 'react'
import { RotateCcw, Filter, Clock, Tag } from 'lucide-react'
import { HistoryItem } from '../types'
import { fetchPredictionHistory } from '../api'

export const HistoryTab: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [riskFilter, setRiskFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await fetchPredictionHistory(page, 20, riskFilter)
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [page, riskFilter])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return isoString
    }
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            Prediction Audit Trail & Historical Inferences
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Full telemetry log of inferences persisted locally in SQLite database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Risk Tiers</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={loadHistory} disabled={loading}>
            <RotateCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Retrieving database records...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No prediction records found for this filter. Run predictions to see records here.
          </div>
        ) : (
          <div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Prediction ID</th>
                    <th>Predicted Class</th>
                    <th>Probability</th>
                    <th>Risk Tier</th>
                    <th>Retention Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8' }}>
                        {row.prediction_id}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: row.predicted_label === 'Abandoned' ? 'var(--risk-high)' : 'var(--risk-low)',
                          }}
                        >
                          {row.predicted_label}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {(row.abandonment_probability * 100).toFixed(1)}%
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            row.risk_level.includes('High')
                              ? 'badge-high'
                              : row.risk_level.includes('Medium')
                              ? 'badge-medium'
                              : 'badge-low'
                          }`}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {row.retention_action || 'Standard Checkout Flow'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
              }}
            >
              <div>
                Showing {items.length} of {total} records
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={items.length < 20}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
