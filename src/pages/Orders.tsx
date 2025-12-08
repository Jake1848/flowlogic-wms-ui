import { useState, useMemo } from 'react'
import { Search, Filter, ShoppingCart, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { useOrderList, useOrderSummary, type Order } from '../hooks/useOrders'

type OrderStatus = 'pending' | 'allocated' | 'picking' | 'packed' | 'shipped' | 'hold' | 'all'
type OrderPriority = 'rush' | 'standard' | 'economy'

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')
  const [page, setPage] = useState(1)

  // Use React Query hooks for real API data
  const { data: ordersResponse, isLoading, error, refetch } = useOrderList({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
    page,
    limit: 50,
  })

  const { data: summary } = useOrderSummary()

  // Extract orders from response
  const orders = useMemo(() => {
    if (!ordersResponse) return []
    // Handle both { data: [...] } and direct array responses
    const data = Array.isArray(ordersResponse) ? ordersResponse : ordersResponse.data || []
    return data.map((order: Order) => ({
      id: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id?.slice(0, 6)}`,
      customer: order.customerName || 'Unknown Customer',
      orderDate: order.orderDate,
      shipBy: order.requiredDate,
      priority: mapPriority(order.priority),
      status: mapStatus(order.status),
      lineCount: order.totalLines || 0,
      totalUnits: order.totalUnits || 0,
      carrier: order.carrier || 'TBD',
    }))
  }, [ordersResponse])

  // Map API status to display status
  function mapStatus(status: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      NEW: 'pending',
      PENDING: 'pending',
      VALIDATED: 'pending',
      ALLOCATED: 'allocated',
      PICKING: 'picking',
      PICKED: 'picking',
      PACKING: 'packed',
      PACKED: 'packed',
      SHIPPING: 'shipped',
      SHIPPED: 'shipped',
      DELIVERED: 'shipped',
      ON_HOLD: 'hold',
      CANCELLED: 'hold',
    }
    return statusMap[status?.toUpperCase()] || 'pending'
  }

  // Map API priority to display priority
  function mapPriority(priority: number | string): OrderPriority {
    if (typeof priority === 'string') {
      return priority.toLowerCase() as OrderPriority
    }
    if (priority <= 2) return 'rush'
    if (priority <= 5) return 'standard'
    return 'economy'
  }

  const getPriorityColor = (priority: OrderPriority) => {
    switch (priority) {
      case 'rush':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'standard':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'economy':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'packed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'picking':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'hold':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'allocated':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  // Calculate status counts from summary or orders
  const statusCounts = useMemo(() => {
    if (summary) {
      return {
        all: summary.totalOrders || orders.length,
        pending: summary.pendingOrders || 0,
        allocated: 0, // Not tracked separately in summary
        picking: summary.inProgressOrders || 0,
        packed: 0, // Not tracked separately in summary
        shipped: summary.completedToday || 0,
        hold: summary.lateOrders || 0,
      }
    }
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      allocated: orders.filter(o => o.status === 'allocated').length,
      picking: orders.filter(o => o.status === 'picking').length,
      packed: orders.filter(o => o.status === 'packed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      hold: orders.filter(o => o.status === 'hold').length,
    }
  }, [summary, orders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all warehouse orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.totalOrders || statusCounts.all}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {statusCounts.picking + statusCounts.allocated}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Shipped Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.completedToday || statusCounts.shipped}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">On Hold</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {summary?.lateOrders || statusCounts.hold}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Status ({statusCounts.all})</option>
              <option value="pending">Pending ({statusCounts.pending})</option>
              <option value="allocated">Allocated ({statusCounts.allocated})</option>
              <option value="picking">Picking ({statusCounts.picking})</option>
              <option value="packed">Packed ({statusCounts.packed})</option>
              <option value="shipped">Shipped ({statusCounts.shipped})</option>
              <option value="hold">On Hold ({statusCounts.hold})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading orders...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400">Failed to load orders. Using cached data.</p>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ship By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lines/Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.shipBy ? new Date(order.shipBy).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.lineCount} / {order.totalUnits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                          View
                        </button>
                        {order.status === 'hold' && (
                          <button className="text-green-600 dark:text-green-400 hover:underline">
                            Release
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersResponse && !Array.isArray(ordersResponse) && ordersResponse.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {ordersResponse.page} of {ordersResponse.totalPages} ({ordersResponse.total} total)
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
                  disabled={page >= ordersResponse.totalPages}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
