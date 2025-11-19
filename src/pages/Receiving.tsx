import { useState } from 'react'
import { Package, CheckCircle, AlertCircle, Truck, ClipboardCheck } from 'lucide-react'

interface PurchaseOrder {
  id: string
  poNumber: string
  vendor: string
  expectedDate: string
  status: 'pending' | 'partial' | 'received' | 'exception'
  itemCount: number
  receivedCount: number
  totalUnits: number
  receivedUnits: number
}

interface ASN {
  id: string
  asnNumber: string
  poNumber: string
  vendor: string
  scheduledArrival: string
  status: 'scheduled' | 'arrived' | 'receiving' | 'completed'
  containers: number
}

export default function Receiving() {
  const [activeTab, setActiveTab] = useState<'pos' | 'asn' | 'putaway'>('pos')

  // Mock PO data
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: '1',
      poNumber: 'PO-2024-001',
      vendor: 'Acme Corp',
      expectedDate: '2024-11-18',
      status: 'pending',
      itemCount: 45,
      receivedCount: 0,
      totalUnits: 1200,
      receivedUnits: 0,
    },
    {
      id: '2',
      poNumber: 'PO-2024-002',
      vendor: 'Global Suppliers Inc',
      expectedDate: '2024-11-17',
      status: 'partial',
      itemCount: 32,
      receivedCount: 18,
      totalUnits: 850,
      receivedUnits: 420,
    },
    {
      id: '3',
      poNumber: 'PO-2024-003',
      vendor: 'Quality Goods LLC',
      expectedDate: '2024-11-16',
      status: 'exception',
      itemCount: 28,
      receivedCount: 15,
      totalUnits: 640,
      receivedUnits: 500,
    },
  ]

  // Mock ASN data
  const asns: ASN[] = [
    {
      id: '1',
      asnNumber: 'ASN-2024-1001',
      poNumber: 'PO-2024-001',
      vendor: 'Acme Corp',
      scheduledArrival: '2024-11-18 09:00',
      status: 'scheduled',
      containers: 3,
    },
    {
      id: '2',
      asnNumber: 'ASN-2024-1002',
      poNumber: 'PO-2024-004',
      vendor: 'Fast Shipping Co',
      scheduledArrival: '2024-11-17 14:30',
      status: 'arrived',
      containers: 5,
    },
  ]

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'partial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'exception':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    }
  }

  const getASNStatusColor = (status: ASN['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'receiving':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'arrived':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Receiving</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage inbound shipments, purchase orders, and putaway operations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Expected Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">8</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">3</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">12</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Exceptions</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">2</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pos'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('asn')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'asn'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              ASN Schedule
            </button>
            <button
              onClick={() => setActiveTab('putaway')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'putaway'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Putaway Queue
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Purchase Orders Tab */}
          {activeTab === 'pos' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Units
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
                  {purchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {po.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(po.expectedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {po.receivedCount} / {po.itemCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {po.receivedUnits} / {po.totalUnits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                          View
                        </button>
                        <button className="text-green-600 dark:text-green-400 hover:underline">
                          Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ASN Tab */}
          {activeTab === 'asn' && (
            <div className="space-y-4">
              {asns.map((asn) => (
                <div
                  key={asn.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {asn.asnNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getASNStatusColor(asn.status)}`}>
                          {asn.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">PO:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                            {asn.poNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {asn.vendor}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Arrival:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {new Date(asn.scheduledArrival).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Containers:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {asn.containers}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                        Check In
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Putaway Queue Tab */}
          {activeTab === 'putaway' && (
            <div className="text-center py-12">
              <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Putaway Queue
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Items waiting to be put away will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
