import { useEffect } from 'react'
import { Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import AlertsPanel from '../components/AlertsPanel'
import ProductionGraph from '../components/ProductionGraph'
import { useDashboard } from '../hooks/useDashboard'
import { useWMSStore } from '../store/useWMSStore'

export default function Dashboard() {
  const { updateMetrics, addAlert } = useWMSStore()
  const { metrics, alerts, skippedLocations, frequentAdjustments } = useDashboard()

  // Sync metrics to global store
  useEffect(() => {
    if (metrics) {
      updateMetrics(metrics)
    }
  }, [metrics, updateMetrics])

  // Sync alerts to global store
  useEffect(() => {
    if (alerts && Array.isArray(alerts)) {
      alerts.forEach((alert) => {
        addAlert(alert)
      })
    }
  }, [alerts, addAlert])

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
            {skippedLocations.map((item) => (
              <div
                key={item.location}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.location}</span>
                <span className="px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                  {item.skipCount} skips
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
            {frequentAdjustments.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.sku}</span>
                <span className="px-3 py-1 text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">
                  {item.adjustmentCount} adjustments
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
