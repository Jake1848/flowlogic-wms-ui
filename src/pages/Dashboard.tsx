import { useEffect } from 'react'
import { Activity, AlertTriangle, TrendingUp, CheckCircle, MapPin, Package, Sparkles } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-white/80">AI-Powered Analytics</span>
          </div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/80 mt-2 max-w-2xl">
            Real-time overview of warehouse performance, inventory health, and AI-driven insights
          </p>
        </div>
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
        {/* Skipped Locations Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 5 Skipped Locations</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Locations frequently bypassed</p>
              </div>
            </div>

            <div className="space-y-3">
              {skippedLocations.map((item, index) => (
                <div
                  key={item.location}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.location}</span>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                    {item.skipCount} skips
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frequent Adjustments Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Frequently Adjusted SKUs</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Items requiring attention</p>
              </div>
            </div>

            <div className="space-y-3">
              {frequentAdjustments.map((item, index) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.sku}</span>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                    {item.adjustmentCount} adjustments
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
