import React from 'react'
import { ShoppingCart, ShieldCheck, Activity, Database, Sparkles } from 'lucide-react'
import { HealthStatus } from '../types'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  health: HealthStatus | null
  healthError: string | null
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, health, healthError }) => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-icon">
            <ShoppingCart size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">CartGuard ML</span>
              <span className="brand-badge">Enterprise v1.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.01em' }}>
              Big Data Cart Abandonment & Retention Engine
            </div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} /> Overview
          </button>
          <button
            className={`nav-tab ${activeTab === 'predictor' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictor')}
          >
            <Sparkles size={16} /> Live Predictor
          </button>
          <button
            className={`nav-tab ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            <Database size={16} /> Batch CSV
          </button>
          <button
            className={`nav-tab ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            <ShieldCheck size={16} /> Model Hub
          </button>
          <button
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Audit Log
          </button>
        </nav>

        <div className="system-status">
          <span className={`status-dot ${health?.model_loaded ? '' : 'offline'}`} />
          <span>
            {health?.model_loaded
              ? `Model Online (v${health.model_version})`
              : healthError || 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  )
}
