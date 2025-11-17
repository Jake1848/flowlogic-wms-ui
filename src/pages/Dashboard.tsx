import { useEffect } from 'react'
import { Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import AlertsPanel from '../components/AlertsPanel'
import ProductionGraph from '../components/ProductionGraph'
import { useFetch } from '../hooks/useFetch'
import { useWMSStore } from '../store/useWMSStore'
import type { Metrics } from '../store/useWMSStore'

export default function Dashboard() {
  const { updateMetrics, addAlert } = useWMSStore()

  // Fetch metrics with auto-refresh every 15 seconds
  const { data: metricsData } = useFetch<Metrics>('/api/metrics', {
    autoRefresh: true,
    refreshInterval: 15000,
  })

  // Fetch alerts
  const { data: alertsData } = useFetch('/api/alerts', {
    autoRefresh: true,
    refreshInterval: 15000,
  })

  useEffect(() => {
    if (metricsData) {
      updateMetrics(metricsData)
    }
  }, [metricsData, updateMetrics])

  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      alertsData.forEach((alert: any) => {
        addAlert(alert)
      })
    }
  }, [alertsData, addAlert])

  const metrics: Metrics = metricsData ?? {
    variancePercent: 0,
    auditCompletion: 0,
    errorRate: 0,
    cycleCountStatus: 'Loading...',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of warehouse performance and key metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Variance %"
          value={`${metrics.variancePercent.toFixed(1)}%`}
          icon={TrendingUp}
          color={metrics.variancePercent < 2 ? 'green' : 'red'}
          trend={{
            value: 0.3,
            isPositive: metrics.variancePercent < 2,
          }}
          index={0}
        />
        <DashboardCard
          title="Audit Completion"
          value={`${metrics.auditCompletion.toFixed(1)}%`}
          icon={CheckCircle}
          color="blue"
          trend={{
            value: 5.2,
            isPositive: true,
          }}
          index={1}
        />
        <DashboardCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          icon={AlertTriangle}
          color={metrics.errorRate < 1 ? 'green' : 'yellow'}
          trend={{
            value: 0.1,
            isPositive: false,
          }}
          index={2}
        />
        <DashboardCard
          title="Cycle Count Status"
          value={metrics.cycleCountStatus}
          icon={Activity}
          color="purple"
          index={3}
        />
      </div>

      {/* Production Graph */}
      <ProductionGraph />

      {/* Alerts Panel */}
      <AlertsPanel />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top 5 Skipped Locations
          </h3>
          <div className="space-y-3">
            {['A-12-34', 'B-05-21', 'C-18-09', 'D-03-45', 'A-22-11'].map((location, idx) => (
              <div
                key={location}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{location}</span>
                <span className="px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                  {5 - idx} skips
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Most Frequently Adjusted SKUs
          </h3>
          <div className="space-y-3">
            {['SKU-1023', 'SKU-2045', 'SKU-3012', 'SKU-1234', 'SKU-5678'].map((sku, idx) => (
              <div
                key={sku}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{sku}</span>
                <span className="px-3 py-1 text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">
                  {8 - idx} adjustments
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
