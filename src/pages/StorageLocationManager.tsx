import { useState } from 'react'
import {
  MapPin,
  Package,
  Warehouse,
  Box,
  RefreshCw,
  Download,
} from 'lucide-react'
import type { StorageLocation, StorageLocationHeader } from '../types/warehouse'

const mockHeader: StorageLocationHeader = {
  center: '8',
  warehouse: '1',
  product: '896727',
  detail: '1',
  desc: 'EMC ORANGE DRNK MX',
  size: '10CT',
  boh: 3937,
  hold: 0,
  primary: 193,
  alternate: 0,
  stocker: 0,
  forward: 0,
  deep: 3744,
  buyerRsv: 0,
  xferIO: 0,
}

const mockLocations: StorageLocation[] = [
  { id: '1', usage: 'P', category: 'D', detail: '1', location: 'SC3524N', licPlate: '18695144', qty: 193, unitOfIssue: 'E', receiptId: '62812', status: 'A', codeDate: '07/30/2027', lotNo: '' },
  { id: '2', usage: 'D', category: 'R', detail: '1', location: 'W350122', licPlate: '84030979', qty: 36, unitOfIssue: 'C', receiptId: '62812', status: 'A', codeDate: '07/30/2027', lotNo: '' },
  { id: '3', usage: 'D', category: 'R', detail: '1', location: 'W310766', licPlate: '18778823', qty: 504, unitOfIssue: 'C', receiptId: '63007', status: 'A', codeDate: '07/30/2027', lotNo: '' },
  { id: '4', usage: 'D', category: 'R', detail: '1', location: 'W240058', licPlate: '19016344', qty: 684, unitOfIssue: 'C', receiptId: '63146', status: 'A', codeDate: '07/30/2027', lotNo: '' },
  { id: '5', usage: 'D', category: 'R', detail: '1', location: 'W220542', licPlate: '19075082', qty: 1332, unitOfIssue: 'C', receiptId: '63314', status: 'A', codeDate: '09/30/2027', lotNo: '' },
  { id: '6', usage: 'D', category: 'R', detail: '1', location: 'W240876', licPlate: '19352190', qty: 1188, unitOfIssue: 'C', receiptId: '63373', status: 'A', codeDate: '09/30/2027', lotNo: '' },
]

export default function StorageLocationManager() {
  const [fromLoc, setFromLoc] = useState('')
  const [toLoc, setToLoc] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('896727')
  const [storageCase, setStorageCase] = useState('36')

  const getUsageBadge = (usage: string) => {
    const styles = {
      P: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Primary' },
      A: { bg: 'bg-green-100', text: 'text-green-800', label: 'Alternate' },
      S: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Stocker' },
      D: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Deep' },
      F: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Forward' },
    }
    const style = styles[usage as keyof typeof styles] || styles.D
    return <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>{style.label}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Storage Location Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">Product location maintenance and inventory tracking (SLM)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Product Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CENTER</label>
            <input
              type="text"
              value={mockHeader.center}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WHSE</label>
            <input
              type="text"
              value={mockHeader.warehouse}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PROD</label>
            <input
              type="text"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DTL</label>
            <input
              type="text"
              value={mockHeader.detail}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desc</label>
            <input
              type="text"
              value={mockHeader.desc}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
            <input
              type="text"
              value={mockHeader.size}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pack / Storage Case</label>
            <div className="flex gap-2">
              <input
                type="text"
                value="1"
                readOnly
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
              <input
                type="text"
                value={storageCase}
                onChange={(e) => setStorageCase(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FROM LOC</label>
            <input
              type="text"
              value={fromLoc}
              onChange={(e) => setFromLoc(e.target.value)}
              placeholder="Enter starting location"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TO LOC</label>
            <input
              type="text"
              value={toLoc}
              onChange={(e) => setToLoc(e.target.value)}
              placeholder="Enter ending location"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Warehouse Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">B/o/h</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.boh.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-red-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Hold</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.hold}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Primary</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.primary}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Alternate</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.alternate}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Warehouse className="w-4 h-4 text-yellow-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Stocker</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.stocker}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Warehouse className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Forward</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.forward}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Warehouse className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Deep</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mockHeader.deep.toLocaleString()}</p>
        </div>
      </div>

      {/* Selection and Reserve Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Warehouse</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Buyer Rsv</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{mockHeader.buyerRsv}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">XFer I/O</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{mockHeader.xferIO}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Selection</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">FlowThru</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Reserve</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{(mockHeader.forward + mockHeader.deep).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">LOCATION DETAILS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">U</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">C</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">D</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lic. Plate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">U/I</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Receipt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CodeDate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lot No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    {getUsageBadge(location.usage)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{location.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{location.detail}</td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{location.location}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{location.licPlate}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{location.qty}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{location.unitOfIssue}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{location.receiptId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{location.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{location.codeDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{location.lotNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
