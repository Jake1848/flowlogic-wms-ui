import { useState } from 'react'
import {
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
} from 'lucide-react'
import type { InventoryBalance } from '../types/warehouse'

const mockBalances: InventoryBalance[] = [
  {
    warehouse: '1',
    type: 'ST',
    detail: '1',
    pack: 1,
    cases: 1,
    size: '36 10CT',
    ti: 12,
    hi: 4,
    boh: 3937,
    inTransit: 0,
    outbound: 0,
  },
]

export default function InventoryBalanceViewer() {
  const [dcNumber, setDcNumber] = useState('8')
  const [productNumber, setProductNumber] = useState('896727')
  const productDesc = 'EMC ORANGE DRNK MX'

  const totalBOH = mockBalances.reduce((sum, bal) => sum + bal.boh, 0)
  const totalInTransit = mockBalances.reduce((sum, bal) => sum + bal.inTransit, 0)
  const totalOutbound = mockBalances.reduce((sum, bal) => sum + bal.outbound, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Balance Viewer</h1>
          <p className="text-gray-600 dark:text-gray-400">Product balance-on-hand inquiry (IBV)</p>
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

      {/* Search Criteria */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DC</label>
            <input
              type="text"
              value={dcNumber}
              onChange={(e) => setDcNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
            <div className="relative">
              <input
                type="text"
                value={productNumber}
                onChange={(e) => setProductNumber(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                <Search className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={productDesc}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Balance on Hand</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBOH.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>Warehouse Total</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInTransit}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Minus className="w-4 h-4" />
            <span>On the way</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outbound</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOutbound}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Minus className="w-4 h-4" />
            <span>Pending shipment</span>
          </div>
        </div>
      </div>

      {/* Product BOH Detail Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">PRODUCT BOH DETAIL</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Whs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dtl</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pack</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Size</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">TI</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">HI</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">BOH</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">In</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockBalances.map((balance, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{balance.warehouse}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{balance.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{balance.detail}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.pack}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.cases}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{balance.size}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.ti}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.hi}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{balance.boh.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.inTransit}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{balance.outbound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Quick Balance Snapshot</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This view shows the balance-on-hand quantity for each product detail across all warehouses in the selected distribution center.
              Intransit and outbound quantities are also displayed for complete visibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
