import { useEffect } from 'react'
import { Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import AlertsPanel from '../components/AlertsPanel'
import ProductionGraph from '../components/ProductionGraph'
import { useDashboard } from '../hooks/useDashboard'
import { useWMSStore } from '../store/useWMSStore'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

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
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Skipped Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skippedLocations.map((item) => (
                <div
                  key={item.location}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.location}</span>
                  <Badge variant="destructive">
                    {item.skipCount} skips
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Frequently Adjusted SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {frequentAdjustments.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.sku}</span>
                  <Badge variant="warning">
                    {item.adjustmentCount} adjustments
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
