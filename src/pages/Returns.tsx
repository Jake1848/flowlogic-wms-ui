import { useState } from 'react'
import { PackageX, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Return {
  id: string
  rmaNumber: string
  orderNumber: string
  customer: string
  returnDate: string
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'damaged' | 'other'
  status: 'pending' | 'approved' | 'received' | 'inspecting' | 'completed' | 'rejected'
  itemCount: number
  totalValue: number
  disposition: 'restock' | 'repair' | 'scrap' | 'vendor_return' | 'pending'
}

export default function Returns() {
  const [statusFilter, setStatusFilter] = useState<'all' | Return['status']>('all')

  // Mock returns data
  const returns: Return[] = [
    {
      id: '1',
      rmaNumber: 'RMA-2024-1001',
      orderNumber: 'ORD-10015',
      customer: 'ABC Retailers Inc',
      returnDate: '2024-11-17',
      reason: 'defective',
      status: 'inspecting',
      itemCount: 3,
      totalValue: 145.99,
      disposition: 'pending',
    },
    {
      id: '2',
      rmaNumber: 'RMA-2024-1002',
      orderNumber: 'ORD-10018',
      customer: 'XYZ Distribution',
      returnDate: '2024-11-16',
      reason: 'wrong_item',
      status: 'received',
      itemCount: 1,
      totalValue: 45.50,
      disposition: 'restock',
    },
    {
      id: '3',
      rmaNumber: 'RMA-2024-1003',
      orderNumber: 'ORD-10022',
      customer: 'Global Supply Co',
      returnDate: '2024-11-15',
      reason: 'damaged',
      status: 'completed',
      itemCount: 2,
      totalValue: 89.99,
      disposition: 'scrap',
    },
    {
      id: '4',
      rmaNumber: 'RMA-2024-1004',
      orderNumber: 'ORD-10025',
      customer: 'Regional Wholesale',
      returnDate: '2024-11-17',
      reason: 'customer_request',
      status: 'pending',
      itemCount: 5,
      totalValue: 234.75,
      disposition: 'pending',
    },
    {
      id: '5',
      rmaNumber: 'RMA-2024-1005',
      orderNumber: 'ORD-10028',
      customer: 'E-Commerce Plus',
      returnDate: '2024-11-14',
      reason: 'defective',
      status: 'rejected',
      itemCount: 1,
      totalValue: 67.25,
      disposition: 'pending',
    },
  ]

  const getReasonColor = (reason: Return['reason']) => {
    switch (reason) {
      case 'defective':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'damaged':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'wrong_item':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'customer_request':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: Return['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'inspecting':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'received':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'approved':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getDispositionColor = (disposition: Return['disposition']) => {
    switch (disposition) {
      case 'restock':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'scrap':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'repair':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'vendor_return':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const filteredReturns = statusFilter === 'all'
    ? returns
    : returns.filter(r => r.status === statusFilter)

  const statusCounts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    received: returns.filter(r => r.status === 'received').length,
    inspecting: returns.filter(r => r.status === 'inspecting').length,
    completed: returns.filter(r => r.status === 'completed').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Returns & RMA</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage return authorizations, inspections, and dispositions
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Create RMA
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Returns</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {returns.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <PackageX className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {statusCounts.pending + statusCounts.approved}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {statusCounts.completed}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {statusCounts.rejected}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">All ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="received">Received ({statusCounts.received})</option>
            <option value="inspecting">Inspecting ({statusCounts.inspecting})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  RMA Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Return Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Disposition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReturns.map((rma) => (
                <tr
                  key={rma.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rma.rmaNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {rma.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {rma.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(rma.returnDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(rma.reason)}`}>
                      {rma.reason.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {rma.itemCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    ${rma.totalValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rma.status)}`}>
                      {rma.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDispositionColor(rma.disposition)}`}>
                      {rma.disposition.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                      View
                    </button>
                    {rma.status === 'pending' && (
                      <button className="text-green-600 dark:text-green-400 hover:underline">
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
