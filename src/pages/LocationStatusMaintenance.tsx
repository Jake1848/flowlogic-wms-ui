import { useState } from 'react'
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react'
import type { LocationInventoryDetail } from '../types/warehouse'

const mockInventory: LocationInventoryDetail[] = [
  {
    id: '1',
    licensePlate: '84803092',
    product: '649288',
    detail: '1',
    qty: 9,
    status: 'A',
    description: 'ACTIVE',
    rsnCode: '',
    productDesc: 'NTCRKR DECOR',
    size: 'EACH',
    codeDate: '11/22/25',
    statusDateTime: '2025-11-22 06:38:45',
  },
]

export default function LocationStatusMaintenance() {
  const [selectedItem, setSelectedItem] = useState<LocationInventoryDetail | null>(null)

  const getStatusBadge = (status: string, desc: string) => {
    switch (status) {
      case 'A':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          {desc}
        </span>
      case 'H':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          <XCircle className="w-3 h-3" />
          HELD
        </span>
      case 'F':
        return <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          FREE
        </span>
      case 'P':
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
          <Clock className="w-3 h-3" />
          PENDING
        </span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{desc}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location Status Maintenance</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage location and inventory status (LSM)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Unlock className="w-4 h-4" />
            Enable
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Lock className="w-4 h-4" />
            Disable
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Location Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DISTRIBUTION CENTER</label>
            <input type="text" value="8" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LOCATION</label>
            <input type="text" value="NA0531" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <div className="flex items-center gap-2">
              <input type="text" value="A" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">ASSIGNED</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <input type="text" value="S" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WAREHOUSE</label>
            <input type="text" value="1" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backfill</label>
            <input type="text" value="E420541" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{mockInventory.filter(i => i.status === 'A').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Held</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{mockInventory.filter(i => i.status === 'H').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{mockInventory.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Detail Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">INVENTORY DETAIL</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">License Plate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dtl</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Desc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">RsnCd</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product Desc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CodeDate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockInventory.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    selectedItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{item.licensePlate}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{item.product}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">{item.detail}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{item.qty}</td>
                  <td className="px-4 py-3">{getStatusBadge(item.status, item.description)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.rsnCode || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.productDesc}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.size}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.codeDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.statusDateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Location Status Management</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Mark locations as 'Free' or 'Held' using Enable/Disable buttons. Manage inventory pallet status by selecting a row and changing the status to 'Active' or 'Held'. Pallets marked as 'Held' are not available for shipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
