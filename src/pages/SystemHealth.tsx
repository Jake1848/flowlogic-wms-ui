import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Brain,
  Loader2,
  Zap,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../lib/api'

interface SystemComponent {
  id: string
  name: string
  type: 'server' | 'database' | 'api' | 'integration' | 'service' | 'ai'
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  responseTime: number
  lastChecked: string
  details?: string
}

interface AIHealthResponse {
  status: string
  timestamp: string
  engines: {
    anomalyDetection: string
    patternRecognition: string
    recommendations: string
  }
  llm: {
    provider: string
    configured: boolean
    model: string | null
  }
}

const mockComponents: SystemComponent[] = [
  { id: 'SYS001', name: 'Primary Application Server', type: 'server', status: 'healthy', uptime: '99.99%', responseTime: 45, lastChecked: '1 min ago' },
  { id: 'SYS002', name: 'WMS Database', type: 'database', status: 'healthy', uptime: '99.98%', responseTime: 12, lastChecked: '30 sec ago' },
  { id: 'SYS003', name: 'Order Processing API', type: 'api', status: 'healthy', uptime: '99.95%', responseTime: 85, lastChecked: '1 min ago' },
  { id: 'SYS004', name: 'WMS Integration - Manhattan', type: 'integration', status: 'healthy', uptime: '99.90%', responseTime: 150, lastChecked: '2 min ago' },
  { id: 'SYS005', name: 'WMS Integration - SAP EWM', type: 'integration', status: 'healthy', uptime: '99.90%', responseTime: 120, lastChecked: '1 min ago' },
  { id: 'SYS006', name: 'Report Generation Service', type: 'service', status: 'healthy', uptime: '99.85%', responseTime: 200, lastChecked: '3 min ago' },
  { id: 'SYS007', name: 'Backup Database', type: 'database', status: 'healthy', uptime: '99.99%', responseTime: 15, lastChecked: '30 sec ago' },
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

const aiAnalyticsData = [
  { time: '06:00', recommendations: 8, anomalies: 3, patterns: 8 },
  { time: '09:00', recommendations: 22, anomalies: 8, patterns: 15 },
  { time: '12:00', recommendations: 35, anomalies: 12, patterns: 24 },
  { time: '15:00', recommendations: 28, anomalies: 5, patterns: 18 },
  { time: '18:00', recommendations: 15, anomalies: 2, patterns: 10 },
  { time: '21:00', recommendations: 10, anomalies: 1, patterns: 6 },
]

export default function SystemHealth() {
  const [activeTab, setActiveTab] = useState<'status' | 'ai-engines' | 'performance' | 'logs'>('status')

  // Fetch AI health status
  const { data: aiHealth, isLoading: aiLoading, refetch: refetchAI } = useQuery<AIHealthResponse>({
    queryKey: ['ai-health'],
    queryFn: async (): Promise<AIHealthResponse> => {
      const response = await api.get<AIHealthResponse>('/ai/health')
      return response.data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

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

  const getStatusBadge = (status: SystemComponent['status'] | string) => {
    const normalizedStatus = status.toLowerCase()
    const styles: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      down: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[normalizedStatus] || styles.inactive}`}>
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
      case 'ai':
        return <Brain className="w-4 h-4" />
    }
  }

  const healthyCount = mockComponents.filter(c => c.status === 'healthy').length
  const degradedCount = mockComponents.filter(c => c.status === 'degraded').length
  const downCount = mockComponents.filter(c => c.status === 'down').length
  const overallHealth = Math.round((healthyCount / mockComponents.length) * 100)

  const aiEnginesActive = aiHealth?.engines ? Object.values(aiHealth.engines).filter(s => s === 'active').length : 0
  const totalAIEngines = 4

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
            <p className="text-gray-500 dark:text-gray-400">Monitor AI engines and system performance</p>
          </div>
        </div>
        <button
          onClick={() => refetchAI()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`rounded-xl p-4 shadow-sm ${
          overallHealth >= 95 ? 'bg-green-500' : overallHealth >= 80 ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">System Health</p>
              <p className="text-3xl font-bold">{overallHealth}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">AI Engines</p>
              <p className="text-3xl font-bold">{aiEnginesActive}/{totalAIEngines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
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
            { id: 'status', label: 'System Status', icon: Server },
            { id: 'ai-engines', label: 'AI Engines', icon: Brain },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
            { id: 'logs', label: 'Recent Events', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* System Status Tab */}
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

      {/* AI Engines Tab */}
      {activeTab === 'ai-engines' && (
        <div className="space-y-6">
          {aiLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Checking AI engines...</span>
            </div>
          ) : (
            <>
              {/* AI Engine Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Anomaly Detection', key: 'anomalyDetection', icon: AlertTriangle, description: 'Statistical outlier detection (Z-score, IQR, MAD)' },
                  { name: 'Pattern Recognition', key: 'patternRecognition', icon: BarChart3, description: 'Temporal and behavioral pattern analysis' },
                  { name: 'Recommendations', key: 'recommendations', icon: Zap, description: 'AI-powered action recommendations' },
                ].map((engine) => {
                  const status = aiHealth?.engines?.[engine.key as keyof typeof aiHealth.engines] || 'inactive'
                  return (
                    <div
                      key={engine.key}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 ${
                        status === 'active' ? 'border-green-500' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          status === 'active' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <engine.icon className={`w-5 h-5 ${
                            status === 'active' ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{engine.name}</h3>
                        </div>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{engine.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* LLM Configuration */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <Brain className="w-10 h-10" />
                  <div>
                    <h3 className="text-lg font-semibold">Language Model Integration</h3>
                    <p className="text-purple-100">Connected to Anthropic Claude for intelligent analysis</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-purple-200">Provider</p>
                    <p className="font-semibold">{aiHealth?.llm?.provider || 'Anthropic'}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-purple-200">Model</p>
                    <p className="font-semibold">{aiHealth?.llm?.model || 'Claude Sonnet 4'}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-purple-200">Status</p>
                    <p className="font-semibold flex items-center gap-1">
                      {aiHealth?.llm?.configured ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Configured
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Not Configured
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Analytics Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Engine Activity (Today)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aiAnalyticsData}>
                      <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="recommendations" stroke="#8B5CF6" fill="#C4B5FD" name="Recommendations" />
                      <Area type="monotone" dataKey="anomalies" stroke="#EF4444" fill="#FCA5A5" name="Anomalies" />
                      <Area type="monotone" dataKey="patterns" stroke="#3B82F6" fill="#93C5FD" name="Patterns" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">CPU Usage</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">68%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Memory</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">72%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { time: '14:32:15', level: 'info', message: 'AI Recommendation Engine completed analysis cycle', source: 'AI Engine' },
              { time: '14:30:00', level: 'info', message: 'Anomaly detection scan completed - 3 anomalies found', source: 'AI Engine' },
              { time: '14:28:45', level: 'info', message: 'WMS data sync completed from Manhattan', source: 'Integration' },
              { time: '14:15:22', level: 'info', message: 'Pattern recognition analysis completed', source: 'AI Engine' },
              { time: '14:10:00', level: 'info', message: 'System health check completed - all systems healthy', source: 'Health Monitor' },
              { time: '14:05:33', level: 'info', message: 'Cache cleared for AI recommendations module', source: 'Cache Service' },
              { time: '14:00:00', level: 'info', message: 'Scheduled backup completed successfully', source: 'Backup Service' },
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
