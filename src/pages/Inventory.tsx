import { useState, useMemo, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Package, MapPin } from 'lucide-react'
import InventoryTable from '../components/InventoryTable'
import { useInventoryList, useInventorySummary, type InventoryItem } from '../hooks/useInventory'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  // Use React Query hooks for real API data
  const { data: inventoryResponse, isLoading, error, refetch } = useInventoryList({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 50,
  })

  const { data: summary } = useInventorySummary()

  // Transform API data to match the InventoryTable expected format
  const inventoryData = useMemo(() => {
    if (!inventoryResponse) return []
    const items = Array.isArray(inventoryResponse) ? inventoryResponse : inventoryResponse.data || []
    return items.map((item: InventoryItem): SKUData => ({
      id: item.id,
      sku: item.sku,
      location: item.locationCode,
      quantity: item.quantity,
      abnCount: item.reservedQty || 0,
      variance: Math.round(((item.quantity - item.availableQty) / (item.quantity || 1)) * 100),
      epStatus: item.status === 'DAMAGED' || item.status === 'QUARANTINE'
        ? 'critical'
        : item.status === 'EXPIRED'
          ? 'flagged'
          : 'clear',
      lastAudit: item.lastCountDate || new Date().toISOString(),
    }))
  }, [inventoryResponse])

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
          <button
            onClick={() => refetch()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total SKUs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.totalItems || inventoryData.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Locations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.totalLocations || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {summary?.lowStockItems || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <TrendingDown className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Expiring Soon</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {summary?.expiringSoon || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by SKU or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="DAMAGED">Damaged</option>
            <option value="QUARANTINE">Quarantine</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading inventory...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400">Failed to load inventory. Using cached data.</p>
        </div>
      )}

      {!isLoading && (
        <InventoryTable
          data={inventoryData}
          onRowClick={handleRowClick}
        />
      )}

      {/* Pagination */}
      {inventoryResponse && !Array.isArray(inventoryResponse) && inventoryResponse.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {inventoryResponse.page} of {inventoryResponse.totalPages} ({inventoryResponse.total} total)
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= inventoryResponse.totalPages}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reserved</div>
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
                Status
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
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Count</div>
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
