import { useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  Calendar,
  AlertTriangle,
  Package,
  RefreshCw,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'

interface ForecastItem {
  id: string
  sku: string
  description: string
  category: string
  currentStock: number
  avgDailySales: number
  forecastedDemand: number
  reorderPoint: number
  safetyStock: number
  daysOfSupply: number
  trend: 'up' | 'down' | 'stable'
  confidence: number
  seasonality: 'high' | 'medium' | 'low'
}

const mockForecasts: ForecastItem[] = [
  { id: '1', sku: 'SKU-10001', description: 'Widget Alpha Pro', category: 'Electronics', currentStock: 450, avgDailySales: 25, forecastedDemand: 750, reorderPoint: 200, safetyStock: 100, daysOfSupply: 18, trend: 'up', confidence: 92, seasonality: 'medium' },
  { id: '2', sku: 'SKU-10002', description: 'Gadget Beta Standard', category: 'Electronics', currentStock: 180, avgDailySales: 15, forecastedDemand: 450, reorderPoint: 150, safetyStock: 75, daysOfSupply: 12, trend: 'stable', confidence: 88, seasonality: 'low' },
  { id: '3', sku: 'SKU-10003', description: 'Connector Assembly Kit', category: 'Components', currentStock: 890, avgDailySales: 45, forecastedDemand: 1350, reorderPoint: 400, safetyStock: 200, daysOfSupply: 20, trend: 'up', confidence: 95, seasonality: 'high' },
  { id: '4', sku: 'SKU-10004', description: 'Premium Gift Box Set', category: 'Seasonal', currentStock: 120, avgDailySales: 35, forecastedDemand: 1050, reorderPoint: 300, safetyStock: 150, daysOfSupply: 3, trend: 'up', confidence: 78, seasonality: 'high' },
  { id: '5', sku: 'SKU-10005', description: 'Basic Cable Pack', category: 'Accessories', currentStock: 2500, avgDailySales: 80, forecastedDemand: 2400, reorderPoint: 800, safetyStock: 400, daysOfSupply: 31, trend: 'down', confidence: 85, seasonality: 'low' },
  { id: '6', sku: 'SKU-10006', description: 'Deluxe Tool Set', category: 'Tools', currentStock: 65, avgDailySales: 8, forecastedDemand: 240, reorderPoint: 80, safetyStock: 40, daysOfSupply: 8, trend: 'stable', confidence: 90, seasonality: 'medium' },
]

const historicalDemand = [
  { month: 'Jul', actual: 4200, forecast: 4100 },
  { month: 'Aug', actual: 4800, forecast: 4500 },
  { month: 'Sep', actual: 5100, forecast: 5200 },
  { month: 'Oct', actual: 5600, forecast: 5400 },
  { month: 'Nov', actual: 7200, forecast: 6800 },
  { month: 'Dec', actual: 8900, forecast: 8500 },
  { month: 'Jan', actual: 5200, forecast: 5400 },
  { month: 'Feb', actual: null, forecast: 5800 },
  { month: 'Mar', actual: null, forecast: 6200 },
  { month: 'Apr', actual: null, forecast: 6500 },
]

const categoryForecast = [
  { category: 'Electronics', current: 15000, forecast: 18500 },
  { category: 'Components', current: 8500, forecast: 9200 },
  { category: 'Accessories', current: 12000, forecast: 11500 },
  { category: 'Seasonal', current: 3500, forecast: 8900 },
  { category: 'Tools', current: 2200, forecast: 2400 },
]

const weeklyPattern = [
  { day: 'Mon', orders: 145 },
  { day: 'Tue', orders: 168 },
  { day: 'Wed', orders: 189 },
  { day: 'Thu', orders: 176 },
  { day: 'Fri', orders: 210 },
  { day: 'Sat', orders: 95 },
  { day: 'Sun', orders: 78 },
]

export default function DemandForecasting() {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'trends'>('overview')
  const [timeHorizon, setTimeHorizon] = useState('30')

  const getTrendIcon = (trend: ForecastItem['trend']) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    return <div className="w-4 h-0.5 bg-gray-400" />
  }

  const getSupplyStatus = (days: number) => {
    if (days <= 7) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    if (days <= 14) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  const lowStockItems = mockForecasts.filter(f => f.daysOfSupply <= 14)
  const avgConfidence = Math.round(mockForecasts.reduce((sum, f) => sum + f.confidence, 0) / mockForecasts.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Forecasting</h1>
          <p className="text-gray-600 dark:text-gray-400">AI-powered inventory demand predictions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh Forecast
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">30-Day Forecast</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">48,500 units</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Forecast Accuracy</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{avgConfidence}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Alerts</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Seasonal Items</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{mockForecasts.filter(f => f.seasonality === 'high').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'items', label: 'Item Forecasts', icon: Package },
            { id: 'trends', label: 'Trends & Patterns', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historical vs Forecasted Demand</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#10B981" fill="#10B98133" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#3B82F6" fill="#3B82F633" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryForecast} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                <YAxis dataKey="category" type="category" tick={{ fill: '#9CA3AF' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
                <Bar dataKey="current" name="Current Stock" fill="#6B7280" />
                <Bar dataKey="forecast" name="30-Day Forecast" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Order Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Forecast ({timeHorizon}d)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days of Supply</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {mockForecasts.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.currentStock.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.forecastedDemand.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSupplyStatus(item.daysOfSupply)}`}>
                      {item.daysOfSupply} days
                    </span>
                  </td>
                  <td className="px-4 py-3">{getTrendIcon(item.trend)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className={`h-2 rounded-full ${item.confidence >= 90 ? 'bg-green-500' : item.confidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${item.confidence}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.confidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending Up</h3>
            <div className="space-y-3">
              {mockForecasts.filter(f => f.trend === 'up').map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.sku}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stable Demand</h3>
            <div className="space-y-3">
              {mockForecasts.filter(f => f.trend === 'stable').map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.sku}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="w-5 h-0.5 bg-gray-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending Down</h3>
            <div className="space-y-3">
              {mockForecasts.filter(f => f.trend === 'down').map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.sku}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
