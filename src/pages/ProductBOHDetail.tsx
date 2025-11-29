import { useState } from 'react'
import {
  Package,
  RefreshCw,
  Download,
  TrendingUp,
} from 'lucide-react'

export default function ProductBOHDetail() {
  const [product, setProduct] = useState('287561')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product BOH Detail</h1>
          <p className="text-gray-600 dark:text-gray-400">Product balance-on-hand inquiry with adjustments (PBD)</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DISTRIBUTION CENTER</label>
            <input type="text" value="8" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WAREHOUSE</label>
            <input type="text" value="1" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LOCATION</label>
            <input type="text" value="SA1474C" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PRODUCT</label>
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPC</label>
            <input type="text" value="10888849004642" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage Case</label>
            <input type="text" value="144" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DTL</label>
            <input type="text" value="1" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" value="QUEST PRT BAR OA" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
            <input type="text" value="2.12" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ti x Hi</label>
            <div className="flex items-center gap-1">
              <input type="text" value="10" readOnly className="w-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
              <span className="text-gray-600 dark:text-gray-400">X</span>
              <input type="text" value="4" readOnly className="w-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sel Loc</label>
            <input type="text" value="SA1474C" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code Date</label>
            <input type="text" value="09/04/2026" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot</label>
            <input type="text" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            ADJUSTMENT SUMMARY
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Location BOH</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">414</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">+Picks/Letdowns</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">54</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Ptwys/Rplns/Rtrns</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Xfer Qty</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between border-t pt-3 border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Realtime BOH</span>
                <span className="text-sm font-bold text-blue-600">468</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">+Inprocess Picks</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">+Pending Picks</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">54</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">+Pending Letdown</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">-Pending Putaways</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">-Pending Replenishments</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Returns</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            SUMMARY COUNT
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SELECT</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RESERVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-2 text-sm text-gray-600 dark:text-gray-400">Active</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">414</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600 dark:text-gray-400">Held</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600 dark:text-gray-400">Pending</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600 dark:text-gray-400">Committed</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900 dark:text-white">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Product BOH Inquiry</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This screen displays detailed balance-on-hand information for a product at a specific location, including adjustment summaries and inventory counts by status and location type.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
