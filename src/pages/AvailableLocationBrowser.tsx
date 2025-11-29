import { useState } from 'react'
import {
  Search,
  RefreshCw,
  Download,
  MapPin,
  Layers,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react'
import type { AvailableLocation } from '../types/warehouse'

const mockAvailableLocations: AvailableLocation[] = [
  {
    id: '1',
    location: 'E481001',
    category: 'R',
    usage: 'D',
    level: 5,
    stackWidth: 40,
    stackDepth: 48,
    height: 96,
    commingle: true,
    product: '',
  },
  {
    id: '2',
    location: 'E481002',
    category: 'R',
    usage: 'D',
    level: 5,
    stackWidth: 40,
    stackDepth: 48,
    height: 96,
    commingle: true,
    product: '',
  },
  {
    id: '3',
    location: 'E481003',
    category: 'R',
    usage: 'D',
    level: 6,
    stackWidth: 40,
    stackDepth: 48,
    height: 84,
    commingle: false,
    product: '',
  },
  {
    id: '4',
    location: 'F010205',
    category: 'S',
    usage: 'F',
    level: 1,
    stackWidth: 20,
    stackDepth: 24,
    height: 42,
    commingle: false,
    product: '',
  },
  {
    id: '5',
    location: 'SA1589A',
    category: 'S',
    usage: 'P',
    level: 1,
    stackWidth: 40,
    stackDepth: 48,
    height: 84,
    commingle: false,
    product: '',
  },
]

export default function AvailableLocationBrowser() {
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [category, setCategory] = useState('')
  const [comingled, setComingled] = useState('')
  const [locationLevel, setLocationLevel] = useState('')
  const [searchAnchor, setSearchAnchor] = useState('')
  const [minLocationHeight, setMinLocationHeight] = useState('0')
  const [maxLocationHeight, setMaxLocationHeight] = useState('9999')
  const [stackWidth, setStackWidth] = useState('')
  const [stackDepth, setStackDepth] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<AvailableLocation | null>(null)

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'S':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">SELECT</span>
      case 'R':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">RESERVE</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{cat}</span>
    }
  }

  const getUsageBadge = (usg: string) => {
    switch (usg) {
      case 'P':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">PRIMARY</span>
      case 'A':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">ALTERNATE</span>
      case 'S':
        return <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs font-medium">STOCKER</span>
      case 'F':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">FORWARD</span>
      case 'D':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">DEEP RSV</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{usg}</span>
    }
  }

  const filteredLocations = mockAvailableLocations.filter(loc => {
    if (category && loc.category !== category) return false
    if (locationLevel && loc.level !== parseInt(locationLevel)) return false
    const minH = parseInt(minLocationHeight) || 0
    const maxH = parseInt(maxLocationHeight) || 9999
    if (loc.height < minH || loc.height > maxH) return false
    if (comingled === 'Y' && !loc.commingle) return false
    if (comingled === 'N' && loc.commingle) return false
    return true
  })

  const handleClearFilters = () => {
    setFromLocation('')
    setToLocation('')
    setCategory('')
    setComingled('')
    setLocationLevel('')
    setSearchAnchor('')
    setMinLocationHeight('0')
    setMaxLocationHeight('9999')
    setStackWidth('')
    setStackDepth('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Location Browser</h1>
          <p className="text-gray-600 dark:text-gray-400">Find available storage locations (ALB)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Search className="w-4 h-4" />
            Find
          </button>
        </div>
      </div>

      {/* Query Criteria */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">AVAILABLE LOCATION BROWSE SELECT CRITERIA</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DISTRIBUTION CENTER</label>
            <input type="text" value="8" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WAREHOUSE</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FROM LOCATION</label>
            <input type="text" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="Start location" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TO LOCATION</label>
            <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="End location" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CATEGORY</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="S">Select</option>
              <option value="R">Reserve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LOCATION LEVEL</label>
            <input type="text" value={locationLevel} onChange={(e) => setLocationLevel(e.target.value)} placeholder="Level" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">COMINGLED</label>
            <select value={comingled} onChange={(e) => setComingled(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEARCH ANCHOR</label>
            <input type="text" value={searchAnchor} onChange={(e) => setSearchAnchor(e.target.value)} placeholder="Anchor location" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MIN LOCATION HEIGHT</label>
            <input type="text" value={minLocationHeight} onChange={(e) => setMinLocationHeight(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MAX LOCATION HEIGHT</label>
            <input type="text" value={maxLocationHeight} onChange={(e) => setMaxLocationHeight(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">STACK WIDTH</label>
            <input type="text" value={stackWidth} onChange={(e) => setStackWidth(e.target.value)} placeholder="Width" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">STACK DEPTH</label>
            <input type="text" value={stackDepth} onChange={(e) => setStackDepth(e.target.value)} placeholder="Depth" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleClearFilters} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            <RefreshCw className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select Locations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.filter(l => l.category === 'S').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reserve Locations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.filter(l => l.category === 'R').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Commingle OK</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.filter(l => l.commingle).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">AVAILABLE LOCATIONS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usage</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Level</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stack Width</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stack Depth</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Height</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Commingle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLocations.map((loc) => (
                <tr
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    selectedLocation?.id === loc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{loc.location}</td>
                  <td className="px-4 py-3">{getCategoryBadge(loc.category)}</td>
                  <td className="px-4 py-3">{getUsageBadge(loc.usage)}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{loc.level}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.stackWidth}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.stackDepth}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{loc.height}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {loc.commingle ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Yes</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{loc.product || '-'}</td>
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
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Available Location Browser</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Search for available storage locations based on criteria like category, level, height, and comingle status. Use this tool to find empty locations for putaway operations or product slotting.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
