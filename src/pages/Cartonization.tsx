import { useState } from 'react'
import {
  BoxSelect,
  Package,
  Ruler,
  Scale,
  Calculator,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface CartonType {
  id: string
  name: string
  dimensions: { length: number; width: number; height: number }
  maxWeight: number
  cost: number
  isActive: boolean
}

interface CartonRecommendation {
  orderId: string
  items: number
  totalVolume: number
  totalWeight: number
  recommendedCarton: string
  fillRate: number
  alternativeCarton?: string
}

const CARTON_TYPES: CartonType[] = [
  { id: 'SM', name: 'Small Box', dimensions: { length: 8, width: 6, height: 4 }, maxWeight: 10, cost: 0.50, isActive: true },
  { id: 'MD', name: 'Medium Box', dimensions: { length: 12, width: 10, height: 8 }, maxWeight: 25, cost: 0.85, isActive: true },
  { id: 'LG', name: 'Large Box', dimensions: { length: 18, width: 14, height: 12 }, maxWeight: 50, cost: 1.25, isActive: true },
  { id: 'XL', name: 'Extra Large', dimensions: { length: 24, width: 18, height: 16 }, maxWeight: 70, cost: 1.75, isActive: true },
  { id: 'FLAT', name: 'Flat Rate', dimensions: { length: 14, width: 12, height: 3 }, maxWeight: 20, cost: 0.95, isActive: true },
  { id: 'POLY', name: 'Poly Mailer', dimensions: { length: 14, width: 10, height: 2 }, maxWeight: 5, cost: 0.25, isActive: true },
]

const mockRecommendations: CartonRecommendation[] = [
  { orderId: 'ORD-10045', items: 3, totalVolume: 145, totalWeight: 8.5, recommendedCarton: 'Small Box', fillRate: 75, alternativeCarton: 'Poly Mailer' },
  { orderId: 'ORD-10046', items: 8, totalVolume: 520, totalWeight: 22.3, recommendedCarton: 'Medium Box', fillRate: 54 },
  { orderId: 'ORD-10047', items: 1, totalVolume: 2100, totalWeight: 45.0, recommendedCarton: 'Large Box', fillRate: 69 },
  { orderId: 'ORD-10048', items: 12, totalVolume: 85, totalWeight: 3.2, recommendedCarton: 'Poly Mailer', fillRate: 42 },
  { orderId: 'ORD-10049', items: 5, totalVolume: 890, totalWeight: 35.8, recommendedCarton: 'Medium Box', fillRate: 93 },
  { orderId: 'ORD-10050', items: 2, totalVolume: 3500, totalWeight: 65.0, recommendedCarton: 'Extra Large', fillRate: 51 },
]

const cartonUsageData = [
  { name: 'Small', count: 245, percentage: 28 },
  { name: 'Medium', count: 312, percentage: 36 },
  { name: 'Large', count: 156, percentage: 18 },
  { name: 'XL', count: 67, percentage: 8 },
  { name: 'Flat', count: 45, percentage: 5 },
  { name: 'Poly', count: 43, percentage: 5 },
]

const fillRateDistribution = [
  { name: 'Excellent (80-100%)', value: 35, color: '#22c55e' },
  { name: 'Good (60-79%)', value: 40, color: '#3b82f6' },
  { name: 'Fair (40-59%)', value: 18, color: '#f59e0b' },
  { name: 'Poor (<40%)', value: 7, color: '#ef4444' },
]

export default function Cartonization() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'cartons' | 'analytics' | 'settings'>('recommendations')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cartonTypes, setCartonTypes] = useState(CARTON_TYPES)

  const handleRunCartonization = () => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 2000)
  }

  const toggleCartonActive = (id: string) => {
    setCartonTypes(prev =>
      prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    )
  }

  const stats = {
    ordersProcessed: 868,
    avgFillRate: 72,
    cartonsSaved: 145,
    costSavings: 182.50,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cartonization</h1>
          <p className="text-gray-600 dark:text-gray-400">Optimize box selection and packing efficiency</p>
        </div>
        <button
          onClick={handleRunCartonization}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              Run Cartonization
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Orders Processed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.ordersProcessed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Fill Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgFillRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <BoxSelect className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cartons Saved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.cartonsSaved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.costSavings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'recommendations', label: 'Recommendations' },
            { id: 'cartons', label: 'Carton Types' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'recommendations' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Volume (in³)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Weight (lbs)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Recommended</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fill Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Alternative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockRecommendations.map((rec) => (
                  <tr key={rec.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{rec.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rec.items}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rec.totalVolume}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rec.totalWeight}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{rec.recommendedCarton}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rec.fillRate >= 80 ? 'bg-green-500' :
                              rec.fillRate >= 60 ? 'bg-blue-500' :
                              rec.fillRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${rec.fillRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{rec.fillRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{rec.alternativeCarton || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cartons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartonTypes.map((carton) => (
            <div key={carton.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 ${carton.isActive ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{carton.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{carton.id}</p>
                </div>
                <button
                  onClick={() => toggleCartonActive(carton.id)}
                  className={`px-2 py-1 rounded text-xs ${carton.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  {carton.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Ruler className="w-4 h-4" />
                  <span>{carton.dimensions.length}" x {carton.dimensions.width}" x {carton.dimensions.height}"</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Scale className="w-4 h-4" />
                  <span>Max {carton.maxWeight} lbs</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <BoxSelect className="w-4 h-4" />
                  <span>Volume: {carton.dimensions.length * carton.dimensions.width * carton.dimensions.height} in³</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">${carton.cost.toFixed(2)}</span>
                  <span className="text-gray-500 text-xs ml-1">per unit</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carton Usage Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cartonUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fill Rate Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fillRateDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ value }) => `${value}%`}
                  >
                    {fillRateDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {fillRateDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cartonization Rules</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Fill Rate Target (%)
                </label>
                <input
                  type="number"
                  defaultValue={60}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight Buffer (%)
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Safety margin below max weight</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="multiBox" defaultChecked className="rounded" />
                <label htmlFor="multiBox" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow multi-box orders
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="costOptimize" defaultChecked className="rounded" />
                <label htmlFor="costOptimize" className="text-sm text-gray-700 dark:text-gray-300">
                  Optimize for lowest cost
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="fragile" className="rounded" />
                <label htmlFor="fragile" className="text-sm text-gray-700 dark:text-gray-300">
                  Consider fragile items separately
                </label>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Packing Strategy</h3>
            <div className="space-y-3">
              {[
                { id: 'smallest', label: 'Smallest Box First', desc: 'Minimize shipping costs' },
                { id: 'bestfit', label: 'Best Fit', desc: 'Optimize fill rate' },
                { id: 'sustainable', label: 'Sustainable', desc: 'Minimize packaging waste' },
                { id: 'speed', label: 'Speed Optimized', desc: 'Fastest packing time' },
              ].map((strategy) => (
                <label key={strategy.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input type="radio" name="packStrategy" defaultChecked={strategy.id === 'bestfit'} className="mt-1" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{strategy.label}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
