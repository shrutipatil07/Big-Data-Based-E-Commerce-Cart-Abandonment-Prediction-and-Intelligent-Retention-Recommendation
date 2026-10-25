import React, { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { OverviewTab } from './components/OverviewTab'
import { PredictorTab } from './components/PredictorTab'
import { BatchTab } from './components/BatchTab'
import { ModelHubTab } from './components/ModelHubTab'
import { HistoryTab } from './components/HistoryTab'
import { HealthStatus, AnalyticsOverview, ModelMetadata } from './types'
import { fetchHealth, fetchAnalyticsOverview, fetchModelMetadata } from './api'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null)

  useEffect(() => {
    async function initSystem() {
      try {
        const h = await fetchHealth()
        setHealth(h)
        setHealthError(null)
      } catch (err: any) {
        setHealthError('Backend Offline')
      }

      try {
        const [a, m] = await Promise.all([
          fetchAnalyticsOverview().catch(() => null),
          fetchModelMetadata().catch(() => null),
        ])
        if (a) setAnalytics(a)
        if (m) setMetadata(m)
      } catch (err) {
        console.error('Prefetch error:', err)
      }
    }

    initSystem()
    const timer = setInterval(async () => {
      try {
        const h = await fetchHealth()
        setHealth(h)
        setHealthError(null)
      } catch {
        setHealthError('Backend Offline')
      }
    }, 15000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        healthError={healthError}
      />

      <main className="content-container">
        {activeTab === 'overview' && (
          <OverviewTab
            analytics={analytics}
            metadata={metadata}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'predictor' && <PredictorTab />}
        {activeTab === 'batch' && <BatchTab />}
        {activeTab === 'model' && <ModelHubTab />}
        {activeTab === 'history' && <HistoryTab />}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          background: 'rgba(9, 13, 22, 0.9)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>CartGuard ML System</strong> &mdash; Big Data-Based E-Commerce Cart Abandonment Prediction & Retention Engine
          </div>
          <div>
            Backend: FastAPI + Scikit-Learn | Database: SQLite | Frontend: React + TypeScript + Vite
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
