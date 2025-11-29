import { useState } from 'react'
import {
  Activity,
  Server,
  Database,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface SystemComponent {
  id: string
  name: string
  type: 'server' | 'database' | 'api' | 'integration' | 'service'
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  responseTime: number
  lastChecked: string
  details?: string
}

const mockComponents: SystemComponent[] = [
  { id: 'SYS001', name: 'Primary Application Server', type: 'server', status: 'healthy', uptime: '99.99%', responseTime: 45, lastChecked: '1 min ago' },
  { id: 'SYS002', name: 'WMS Database', type: 'database', status: 'healthy', uptime: '99.98%', responseTime: 12, lastChecked: '30 sec ago' },
  { id: 'SYS003', name: 'Order Processing API', type: 'api', status: 'healthy', uptime: '99.95%', responseTime: 85, lastChecked: '1 min ago' },
  { id: 'SYS004', name: 'Shopify Integration', type: 'integration', status: 'degraded', uptime: '98.50%', responseTime: 350, lastChecked: '2 min ago', details: 'Elevated response times detected' },
  { id: 'SYS005', name: 'FedEx Shipping API', type: 'integration', status: 'healthy', uptime: '99.90%', responseTime: 120, lastChecked: '1 min ago' },
  { id: 'SYS006', name: 'Report Generation Service', type: 'service', status: 'healthy', uptime: '99.85%', responseTime: 200, lastChecked: '3 min ago' },
  { id: 'SYS007', name: 'Backup Database', type: 'database', status: 'healthy', uptime: '99.99%', responseTime: 15, lastChecked: '30 sec ago' },
  { id: 'SYS008', name: 'EDI Gateway', type: 'integration', status: 'down', uptime: '95.20%', responseTime: 0, lastChecked: '5 min ago', details: 'Connection refused - investigating' },
]

const performanceData = [
  { time: '00:00', cpu: 45, memory: 62, requests: 120 },
  { time: '04:00', cpu: 32, memory: 58, requests: 80 },
  { time: '08:00', cpu: 68, memory: 72, requests: 450 },
  { time: '12:00', cpu: 75, memory: 78, requests: 580 },
  { time: '16:00', cpu: 82, memory: 80, requests: 620 },
  { time: '20:00', cpu: 55, memory: 68, requests: 280 },
]

const uptimeData = [
  { day: 'Mon', uptime: 99.99 },
  { day: 'Tue', uptime: 99.98 },
  { day: 'Wed', uptime: 99.95 },
  { day: 'Thu', uptime: 100 },
  { day: 'Fri', uptime: 99.92 },
  { day: 'Sat', uptime: 100 },
  { day: 'Sun', uptime: 99.99 },
]

export default function SystemHealth() {
  const [activeTab, setActiveTab] = useState<'status' | 'performance' | 'logs'>('status')

  const getStatusIcon = (status: SystemComponent['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: SystemComponent['status']) => {
    const styles = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      down: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeIcon = (type: SystemComponent['type']) => {
    switch (type) {
      case 'server':
        return <Server className="w-4 h-4" />
      case 'database':
        return <Database className="w-4 h-4" />
      case 'api':
        return <Activity className="w-4 h-4" />
      case 'integration':
        return <Wifi className="w-4 h-4" />
      case 'service':
        return <Cpu className="w-4 h-4" />
    }
  }

  const healthyCount = mockComponents.filter(c => c.status === 'healthy').length
  const degradedCount = mockComponents.filter(c => c.status === 'degraded').length
  const downCount = mockComponents.filter(c => c.status === 'down').length
  const overallHealth = Math.round((healthyCount / mockComponents.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor system status and performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 shadow-sm ${
          overallHealth >= 95 ? 'bg-green-500' : overallHealth >= 80 ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Overall Health</p>
              <p className="text-3xl font-bold">{overallHealth}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Healthy</p>
              <p className="text-xl font-bold text-green-600">{healthyCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Degraded</p>
              <p className="text-xl font-bold text-yellow-600">{degradedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Down</p>
              <p className="text-xl font-bold text-red-600">{downCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'status', label: 'System Status' },
            { id: 'performance', label: 'Performance' },
            { id: 'logs', label: 'Recent Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'status' | 'performance' | 'logs')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'status' && (
        <div className="space-y-4">
          {mockComponents.map((component) => (
            <div
              key={component.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 ${
                component.status === 'healthy'
                  ? 'border-green-500'
                  : component.status === 'degraded'
                  ? 'border-yellow-500'
                  : 'border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(component.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{component.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {getTypeIcon(component.type)}
                        {component.type}
                      </span>
                    </div>
                    {component.details && (
                      <p className="text-sm text-gray-500 mt-1">{component.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Uptime</p>
                    <p className="font-medium text-gray-900 dark:text-white">{component.uptime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Response</p>
                    <p className={`font-medium ${
                      component.responseTime === 0 ? 'text-red-600' :
                      component.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {component.responseTime > 0 ? `${component.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last Check</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {component.lastChecked}
                    </p>
                  </div>
                  {getStatusBadge(component.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Usage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#3B82F6" fill="#93C5FD" name="CPU %" />
                  <Area type="monotone" dataKey="memory" stroke="#10B981" fill="#6EE7B7" name="Memory %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Uptime</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uptimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[99, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Uptime']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resource Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">CPU Usage</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">68%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Memory</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">72%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900 dark:text-white">Storage</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">54%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '54%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { time: '14:32:15', level: 'info', message: 'Scheduled backup completed successfully', source: 'Backup Service' },
              { time: '14:28:45', level: 'warning', message: 'Shopify API response time elevated (>300ms)', source: 'Integration Monitor' },
              { time: '14:15:22', level: 'error', message: 'EDI Gateway connection refused - retry attempt 3/5', source: 'EDI Service' },
              { time: '14:10:00', level: 'info', message: 'System health check completed', source: 'Health Monitor' },
              { time: '14:05:33', level: 'info', message: 'Cache cleared for inventory module', source: 'Cache Service' },
              { time: '14:00:00', level: 'info', message: 'Hourly metrics collection started', source: 'Metrics Collector' },
            ].map((log, index) => (
              <div key={index} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className="text-sm font-mono text-gray-500">{log.time}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  log.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  log.level === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="flex-1 text-gray-900 dark:text-white">{log.message}</span>
                <span className="text-sm text-gray-500">{log.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
