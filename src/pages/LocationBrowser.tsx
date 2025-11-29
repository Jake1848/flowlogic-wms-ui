import { useState } from 'react'
import {
  Search,
  RefreshCw,
  Download,
  MapPin,
  Layers,
  Grid3X3,
  Package,
} from 'lucide-react'
import type { LocationBrowse } from '../types/warehouse'

const mockLocations: LocationBrowse[] = [
  {
    id: '1',
    location: 'SA1474A',
    description: 'SELECT A',
    category: 'S',
    usage: 'P',
    level: 1,
    stockWidth: 40,
    stockDepth: 48,
    selPos: 2,
    selHgt: 84,
    rsvPos: 0,
    rsvHgt: 0,
    commingle: false,
    product: '287561',
  },
  {
    id: '2',
    location: 'SA1474B',
    description: 'SELECT B',
    category: 'S',
    usage: 'A',
    level: 2,
    stockWidth: 40,
    stockDepth: 48,
    selPos: 2,
    selHgt: 84,
    rsvPos: 0,
    rsvHgt: 0,
    commingle: false,
    product: '287561',
  },
  {
    id: '3',
    location: 'E481587',
    description: 'RESERVE A',
    category: 'R',
    usage: 'D',
    level: 7,
    stockWidth: 40,
    stockDepth: 48,
    selPos: 0,
    selHgt: 0,
    rsvPos: 1,
    rsvHgt: 96,
    commingle: true,
    product: '713902',
  },
  {
    id: '4',
    location: 'F010101',
    description: 'FORWARD',
    category: 'S',
    usage: 'F',
    level: 1,
    stockWidth: 20,
    stockDepth: 24,
    selPos: 4,
    selHgt: 42,
    rsvPos: 0,
    rsvHgt: 0,
    commingle: false,
    product: '649288',
  },
]

export default function LocationBrowser() {
  const [searchLocation, setSearchLocation] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [usage, setUsage] = useState('')
  const [level, setLevel] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationBrowse | null>(null)

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
      case 'T':
        return <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">TEMP</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{usg}</span>
    }
  }

  const filteredLocations = mockLocations.filter(loc => {
    if (searchLocation && !loc.location.toLowerCase().includes(searchLocation.toLowerCase())) return false
    if (category && loc.category !== category) return false
    if (usage && loc.usage !== usage) return false
    if (level && loc.level !== parseInt(level)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location Browser</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and search warehouse locations (LBR)</p>
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

      {/* Query Criteria */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">LOCATION BROWSE QUERY CRITERIA</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distribution Center</label>
            <input type="text" value="8" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="Enter location" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="S">Select</option>
              <option value="R">Reserve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usage</label>
            <select value={usage} onChange={(e) => setUsage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="P">Primary</option>
              <option value="A">Alternate</option>
              <option value="S">Stocker</option>
              <option value="F">Forward</option>
              <option value="D">Deep Reserve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
            <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Enter level" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
          </div>
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Grid3X3 className="w-5 h-5 text-green-600" />
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
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Commingle Allowed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredLocations.filter(l => l.commingle).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">LOCATION RESULTS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usage</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Level</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock Width</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock Depth</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sel Pos</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sel Hgt</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rsv Pos</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rsv Hgt</th>
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
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{loc.description}</td>
                  <td className="px-4 py-3">{getCategoryBadge(loc.category)}</td>
                  <td className="px-4 py-3">{getUsageBadge(loc.usage)}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{loc.level}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.stockWidth}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.stockDepth}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{loc.selPos}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.selHgt}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{loc.rsvPos}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{loc.rsvHgt}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {loc.commingle ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Yes</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{loc.product}</td>
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
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Location Browser</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Search and browse warehouse locations by various criteria including category, usage type, and level. Click on a location row to view additional details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
