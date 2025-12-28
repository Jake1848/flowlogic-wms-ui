import { useState } from 'react'
import { Bell, Settings, Brain, Activity } from 'lucide-react'
import { useAlertList, useAlertCounts, useAcknowledgeAlert, type Alert } from '../hooks/useAlerts'
import { useAnomalyDetection, usePatternAnalysis } from '../hooks/useAIAnalysis'
import {
  AlertStatCards,
  AlertList,
  AnomalyPanel,
  PatternPanel,
  AlertDetailModal
} from '../components/alerts'
import type { AlertTab } from '../types/alerts'

// Mock alerts fallback
const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    type: 'INVENTORY',
    severity: 'CRITICAL',
    title: 'Stock Out - SKU-10045',
    message: 'Primary pick location A-12-03 is empty. Replenishment required immediately.',
    status: 'NEW',
    referenceNumber: 'SKU-10045',
    createdAt: '2024-01-15T10:32:15Z',
    updatedAt: '2024-01-15T10:32:15Z',
  },
  {
    id: 'ALT-002',
    type: 'SHIPPING',
    severity: 'CRITICAL',
    title: 'Carrier Cutoff Approaching',
    message: 'UPS Ground cutoff in 30 minutes. 12 orders pending shipment.',
    status: 'NEW',
    referenceNumber: 'WAVE-001',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ALT-003',
    type: 'INVENTORY',
    severity: 'WARNING',
    title: 'Low Stock Warning',
    message: 'SKU-20089 below minimum threshold (24 units remaining, min: 50)',
    status: 'NEW',
    referenceNumber: 'SKU-20089',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
]

const tabs = [
  { id: 'alerts' as const, label: 'System Alerts', icon: Bell },
  { id: 'anomalies' as const, label: 'AI Anomaly Detection', icon: Bell },
  { id: 'patterns' as const, label: 'Pattern Analysis', icon: Activity }
]

export default function Alerts() {
  const [activeTab, setActiveTab] = useState<AlertTab>('alerts')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showAcknowledged, setShowAcknowledged] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [anomalyType, setAnomalyType] = useState<string>('adjustments')

  // Alert data
  const { data: alertData, isLoading, error } = useAlertList({
    severity: filterSeverity !== 'all' ? filterSeverity : undefined,
    type: filterCategory !== 'all' ? filterCategory : undefined,
  })
  const { data: alertCounts } = useAlertCounts()
  const acknowledgeAlert = useAcknowledgeAlert()

  // AI analysis data
  const { anomalyData, anomalyLoading, runAnomalyDetection } = useAnomalyDetection(
    anomalyType,
    activeTab === 'anomalies'
  )
  const { patternData, patternLoading, refetchPatterns } = usePatternAnalysis(
    activeTab === 'patterns'
  )

  const alerts: Alert[] = alertData?.data || mockAlerts
  const criticalCount = alertCounts?.critical ?? alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId)
  }

  const handleRunAnalysis = () => {
    if (activeTab === 'anomalies') {
      runAnomalyDetection.mutate()
    } else if (activeTab === 'patterns') {
      refetchPatterns()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & AI Detection</h1>
            <p className="text-gray-500 dark:text-gray-400">AI-powered monitoring and anomaly detection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <Settings className="w-4 h-4" />
            Alert Rules
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={runAnomalyDetection.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {runAnomalyDetection.isPending ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <AlertStatCards
        criticalCount={criticalCount}
        anomalyCount={anomalyData?.summary?.anomalyCount ?? 0}
        patternCount={patternData?.summary?.totalPatterns ?? 0}
        anomalyRate={anomalyData?.summary?.anomalyRate ?? 0}
      />

      {/* Tab Content */}
      {activeTab === 'alerts' && (
        <AlertList
          alerts={alerts}
          isLoading={isLoading}
          error={error}
          filterSeverity={filterSeverity}
          filterCategory={filterCategory}
          showAcknowledged={showAcknowledged}
          onFilterSeverityChange={setFilterSeverity}
          onFilterCategoryChange={setFilterCategory}
          onShowAcknowledgedChange={setShowAcknowledged}
          onSelectAlert={setSelectedAlert}
          onAcknowledge={handleAcknowledge}
        />
      )}

      {activeTab === 'anomalies' && (
        <AnomalyPanel
          anomalyType={anomalyType}
          onAnomalyTypeChange={setAnomalyType}
          anomalyData={anomalyData}
          isLoading={anomalyLoading}
        />
      )}

      {activeTab === 'patterns' && (
        <PatternPanel
          patternData={patternData}
          isLoading={patternLoading}
        />
      )}

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  )
}
