import {
  Activity,
  Save,
  TrendingUp,
} from 'lucide-react'

export default function PickPerformanceSetup() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pick Performance Setup</h1>
          <p className="text-gray-600 dark:text-gray-400">Handling times and selection factors (PPS)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Product Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DISTRIBUTION CENTER</label>
            <input type="text" value="8" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PRODUCT</label>
            <input type="text" value="896727" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PRODUCT DETAIL</label>
            <input type="text" value="1" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEL LOC</label>
            <input type="text" value="SC3524N" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input type="text" value="EMC ORANGE DRNK MX" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
      </div>

      {/* Handling Times */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Handling Times
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catch Weight</label>
            <input type="number" step="0.0001" defaultValue="0.0000" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forklift Cases Handled</label>
            <input type="number" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Handling Time</label>
            <input type="number" step="0.0001" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price Label Apply Time</label>
            <input type="number" step="0.0001" defaultValue="0.0000" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EAS Material Apply Time</label>
            <input type="number" step="0.0001" defaultValue="0.0000" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Selection Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Selection Factors
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"></th>
                <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border-l border-r border-gray-200 dark:border-gray-600">First Unit</th>
                <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-600">Additional</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Factors</th>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-600">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-l border-gray-200 dark:border-gray-600">Constant</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">Allow</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Constant</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">Allow</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Default Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { label: 'Case Select', values: ['0.0912', '0.0000', '0.0752', '0.0000', '1.00'] },
                { label: 'Case Multiple Select', values: ['0.0912', '0.0000', '0.0752', '0.0000', '1.00'] },
                { label: 'Inner Select', values: ['0.0717', '0.0000', '0.0517', '0.0000', ''] },
                { label: 'Inner Multiple Select', values: ['0.0717', '0.0000', '0.0517', '0.0000', '1.00'] },
                { label: 'Eaches Select', values: ['0.0717', '0.0000', '0.0517', '0.0000', ''] },
                { label: 'Eaches Multiple Select', values: ['0.0717', '0.0000', '0.0517', '0.0000', '1.00'] },
                { label: 'Case Replen/Putaway', values: ['0.0710', '0.0000', '0.0710', '0.0000', ''] },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                    <input type="number" step="0.0001" defaultValue={row.values[0]} className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm" />
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                    <input type="number" step="0.0001" defaultValue={row.values[1]} className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.0001" defaultValue={row.values[2]} className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm" />
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                    <input type="number" step="0.0001" defaultValue={row.values[3]} className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.values[4] && <input type="number" step="0.01" defaultValue={row.values[4]} className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm" />}
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
