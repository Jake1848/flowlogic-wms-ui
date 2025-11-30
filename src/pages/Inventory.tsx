import { useMemo, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import InventoryTable from '../components/InventoryTable'
import { useFetch } from '../hooks/useFetch'
import { useWMSStore } from '../store/useWMSStore'
import type { SKUData } from '../store/useWMSStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Generate historical data outside component to avoid recreating on every render
const generateHistoricalData = (skuId: string) => {
  // Use SKU id as seed for consistent data per SKU
  const seed = skuId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const data = []
  for (let i = 30; i >= 0; i--) {
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      quantity: Math.floor(((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * 200) + 800,
    })
  }
  return data
}

export default function Inventory() {
  const { selectedSKU, setSelectedSKU } = useWMSStore()
  const { data: inventoryData } = useFetch<SKUData[]>('/api/inventory', {
    autoRefresh: true,
    refreshInterval: 30000,
  })

  // Memoize historical data based on selected SKU
  const historicalData = useMemo(
    () => selectedSKU ? generateHistoricalData(selectedSKU.id) : [],
    [selectedSKU?.id]
  )

  const handleRowClick = useCallback((sku: SKUData) => setSelectedSKU(sku), [setSelectedSKU])
  const handleClosePanel = useCallback(() => setSelectedSKU(null), [setSelectedSKU])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time inventory tracking and SKU analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {inventoryData?.length || 0}
            </div>
          </div>
        </div>
      </div>

      <InventoryTable
        data={inventoryData || []}
        onRowClick={handleRowClick}
      />

      {/* Side Panel for Selected SKU */}
      {selectedSKU && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">SKU Details</h2>
            <button
              onClick={handleClosePanel}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* SKU Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                SKU ID
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedSKU.sku}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedSKU.location}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity</div>
                <div
                  className={`text-lg font-bold ${
                    selectedSKU.quantity < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {selectedSKU.quantity}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ABN Count</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedSKU.abnCount}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variance</div>
                <div
                  className={`text-lg font-bold flex items-center ${
                    Math.abs(selectedSKU.variance) > 5
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {selectedSKU.variance > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {selectedSKU.variance}%
                </div>
              </div>
            </div>

            {/* EP Status */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Error Prevention Status
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle
                  className={`w-5 h-5 ${
                    selectedSKU.epStatus === 'critical'
                      ? 'text-red-600'
                      : selectedSKU.epStatus === 'flagged'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                />
                <span
                  className={`text-lg font-bold capitalize ${
                    selectedSKU.epStatus === 'critical'
                      ? 'text-red-600 dark:text-red-400'
                      : selectedSKU.epStatus === 'flagged'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {selectedSKU.epStatus}
                </span>
              </div>
            </div>

            {/* Last Audit */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Audit</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(selectedSKU.lastAudit).toLocaleString()}
              </div>
            </div>

            {/* Historical Chart */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                30-Day Quantity History
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historicalData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {[
                  { action: 'Cycle Count', qty: '+5', time: '2 hours ago' },
                  { action: 'Pick', qty: '-12', time: '5 hours ago' },
                  { action: 'Replenishment', qty: '+50', time: '1 day ago' },
                  { action: 'Adjustment', qty: '-3', time: '2 days ago' },
                ].map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.action}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        activity.qty.startsWith('+')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {activity.qty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
