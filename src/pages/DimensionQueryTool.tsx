import { useState } from 'react'
import {
  Search,
  Calendar,
  Filter,
  Download,
} from 'lucide-react'

export default function DimensionQueryTool() {
  const [distributionCenter, setDistributionCenter] = useState('8')
  const [warehouse, setWarehouse] = useState('1')
  const [variance, setVariance] = useState('')
  const [fromDate, setFromDate] = useState('11/08/2025')
  const [toDate, setToDate] = useState('11/20/2025')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dimension Query Tool</h1>
          <p className="text-gray-600 dark:text-gray-400">Dimension interface select criteria (DQT)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Search Criteria Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Filter className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Criteria</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Filter dimension updates by date range and variance</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Distribution Center
              </label>
              <input
                type="text"
                value={distributionCenter}
                onChange={(e) => setDistributionCenter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warehouse
              </label>
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variance
            </label>
            <input
              type="number"
              value={variance}
              onChange={(e) => setVariance(e.target.value)}
              placeholder="Enter variance value"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                From Date
              </label>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                To Date
              </label>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Today
        </button>
        <button className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Last 7 Days
        </button>
        <button className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Last 30 Days
        </button>
        <button className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Custom Range
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex gap-4">
          <Search className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-medium text-blue-900 dark:text-blue-300 mb-2">Dimension Search</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
              Use this tool to search for dimension updates within a specified date range. Filter by distribution center, warehouse, and variance to find specific dimension changes that occurred during the selected period.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Search Criteria</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">DC {distributionCenter} - Warehouse {warehouse}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{fromDate} to {toDate}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Expected Results</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dimension updates matching criteria</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Click Search to execute query</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Results Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Configure your search criteria above and click Search to view dimension updates.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Search className="w-5 h-5" />
            Execute Search
          </button>
        </div>
      </div>
    </div>
  )
}
