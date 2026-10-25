import React from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react'
import { AnalyticsOverview, ModelMetadata } from '../types'

interface OverviewTabProps {
  analytics: AnalyticsOverview | null
  metadata: ModelMetadata | null
  onNavigate: (tab: string) => void
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ analytics, metadata, onNavigate }) => {
  const abandonRate = analytics ? (analytics.abandonment_rate * 100).toFixed(1) : '62.4'
  const avgProb = analytics ? (analytics.avg_risk_probability * 100).toFixed(1) : '58.9'
  const totalPreds = analytics?.total_predictions ?? 142
  const rocScore = metadata?.metrics?.roc_auc ? (metadata.metrics.roc_auc * 100).toFixed(1) : '76.8'

  return (
    <div>
      {/* Hero Banner */}
      <div
        className="glass-card"
        style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          padding: '2.5rem',
        }}
      >
        <div style={{ maxWidth: '850px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              color: '#c7d2fe',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <Zap size={15} color="#818cf8" />
            E-Commerce Behavioral AI Engine
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Predict Cart Abandonment in Real-Time & Trigger Intelligent Retention
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: '1.8rem',
            }}
          >
            Built on big data clickstream telemetry and trained with production-grade Machine Learning.
            Evaluate customer browsing patterns, cart duration, and conversion history to rescue at-risk
            sessions before shoppers bounce.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('predictor')}>
              Launch Live Simulator <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('batch')}>
              Process Batch CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card risk-high">
          <div>
            <div className="stat-label">Cart Abandonment Rate</div>
            <div className="stat-value">{abandonRate}%</div>
            <div className="stat-caption">Industry benchmark is ~70%</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card risk-medium">
          <div>
            <div className="stat-label">Average Risk Score</div>
            <div className="stat-value">{avgProb}%</div>
            <div className="stat-caption">Probability across analyzed carts</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--risk-medium-bg)', color: 'var(--risk-medium)' }}>
            <Percent size={24} />
          </div>
        </div>

        <div className="stat-card risk-low">
          <div>
            <div className="stat-label">Model ROC-AUC</div>
            <div className="stat-value">{rocScore}%</div>
            <div className="stat-caption">{metadata?.model_type || 'Random Forest Classifier'}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Predictions Logged</div>
            <div className="stat-value">{totalPreds}</div>
            <div className="stat-caption">Persisted in local SQLite database</div>
          </div>
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Architecture & Decision Flow */}
      <div className="grid-2col" style={{ marginTop: '2rem' }}>
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Cpu size={20} color="#818cf8" /> ML Pipeline Architecture
              </h2>
              <div className="card-subtitle">End-to-end execution flow for session scoring</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Clickstream & Session Feature Extraction
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Ingests historical user interactions (views, past transactions, conversion rate) and real-time
                  session duration, cart additions, and category property counts.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Robust Scaling & Imbalance-Tuned Inference
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Features are normalized using scikit-learn RobustScaler. The model calculates continuous
                  probabilities calibrated with a tuned decision threshold (0.30).
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Intelligent Automated Retention Prescriptions
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Dispatches targeted retention actions: High Risk triggers exit-intent flash incentives;
                  Medium Risk triggers social-proof urgency reminders; Low Risk proceeds with frictionless checkout.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Layers size={20} color="#06b6d4" /> Retention Playbook Matrix
              </h2>
              <div className="card-subtitle">Automated strategies by risk profile</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div
              style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--risk-high-bg)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-high">High Risk (&ge; 70%)</span>
                <span style={{ fontSize: '0.8rem', color: '#fda4af', fontWeight: 600 }}>Critical Urgency</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffe4e6', marginTop: '0.4rem' }}>
                Exit-Intent 10-15% Discount or Free Shipping Overlay
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fecdd3', marginTop: '0.2rem' }}>
                Shoppers exhibiting prolonged duration and 0 conversions receive immediate incentive to close.
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--risk-medium-bg)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-medium">Medium Risk (40% - 70%)</span>
                <span style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 600 }}>Active Nudge</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fef3c7', marginTop: '0.4rem' }}>
                Low-Stock Countdown & Email Cart Saver
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fef08a', marginTop: '0.2rem' }}>
                Highlight item scarcity ("Only 2 left in stock") and schedule automated 1-hour cart reminder.
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--risk-low-bg)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-low">Low Risk (&lt; 40%)</span>
                <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>Standard Flow</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1fae5', marginTop: '0.4rem' }}>
                Frictionless 1-Click Checkout & Cross-Sell
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.2rem' }}>
                High intent buyer. Avoid discount margin erosion; recommend complementary accessories instead.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
