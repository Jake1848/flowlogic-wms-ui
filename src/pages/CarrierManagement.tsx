import { useState } from 'react'
import {
  Truck,
  Plane,
  Ship,
  Search,
  Plus,
  Edit,
  Star,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Carrier {
  id: string
  carrierCode: string
  name: string
  type: 'ltl' | 'ftl' | 'parcel' | 'air' | 'ocean' | 'rail' | 'courier'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  rating: number
  onTimeRate: number
  damageRate: number
  avgTransitDays: number
  volumeYTD: number
  spendYTD: number
  contact: string
  phone: string
  email: string
  services: string[]
}

interface Rate {
  id: string
  carrierId: string
  serviceType: string
  origin: string
  destination: string
  minWeight: number
  maxWeight: number
  rate: number
  fuelSurcharge: number
  effectiveDate: string
  expirationDate: string
}

const mockCarriers: Carrier[] = [
  { id: '1', carrierCode: 'UPS', name: 'United Parcel Service', type: 'parcel', status: 'active', rating: 4.5, onTimeRate: 96.5, damageRate: 0.3, avgTransitDays: 2.1, volumeYTD: 15420, spendYTD: 245000, contact: 'John Smith', phone: '1-800-742-5877', email: 'business@ups.com', services: ['Ground', 'Next Day Air', '2nd Day Air', '3 Day Select'] },
  { id: '2', carrierCode: 'FEDEX', name: 'FedEx Corporation', type: 'parcel', status: 'active', rating: 4.4, onTimeRate: 95.8, damageRate: 0.4, avgTransitDays: 2.3, volumeYTD: 12890, spendYTD: 198000, contact: 'Sarah Johnson', phone: '1-800-463-3339', email: 'business@fedex.com', services: ['Ground', 'Express', 'Freight', 'International'] },
  { id: '3', carrierCode: 'XPO', name: 'XPO Logistics', type: 'ltl', status: 'active', rating: 4.2, onTimeRate: 93.5, damageRate: 0.8, avgTransitDays: 3.5, volumeYTD: 2340, spendYTD: 156000, contact: 'Mike Williams', phone: '1-800-755-2728', email: 'sales@xpo.com', services: ['LTL', 'Truckload', 'Expedited'] },
  { id: '4', carrierCode: 'SAIA', name: 'SAIA LTL Freight', type: 'ltl', status: 'active', rating: 4.0, onTimeRate: 91.2, damageRate: 1.1, avgTransitDays: 4.2, volumeYTD: 1560, spendYTD: 89000, contact: 'Emily Davis', phone: '1-800-765-7242', email: 'info@saia.com', services: ['LTL', 'Guaranteed', 'Trade Show'] },
  { id: '5', carrierCode: 'USPS', name: 'US Postal Service', type: 'parcel', status: 'active', rating: 3.8, onTimeRate: 88.5, damageRate: 0.6, avgTransitDays: 3.8, volumeYTD: 8920, spendYTD: 45000, contact: 'James Brown', phone: '1-800-275-8777', email: 'business@usps.com', services: ['Priority Mail', 'First Class', 'Parcel Select', 'Media Mail'] },
  { id: '6', carrierCode: 'JBHUNT', name: 'J.B. Hunt Transport', type: 'ftl', status: 'active', rating: 4.3, onTimeRate: 94.8, damageRate: 0.5, avgTransitDays: 2.8, volumeYTD: 890, spendYTD: 234000, contact: 'Lisa Chen', phone: '1-800-452-4868', email: 'sales@jbhunt.com', services: ['Truckload', 'Intermodal', 'Dedicated'] },
  { id: '7', carrierCode: 'DHL', name: 'DHL Express', type: 'air', status: 'active', rating: 4.1, onTimeRate: 92.3, damageRate: 0.7, avgTransitDays: 4.5, volumeYTD: 3240, spendYTD: 178000, contact: 'Robert Kim', phone: '1-800-225-5345', email: 'business@dhl.com', services: ['Express', 'Freight', 'Supply Chain'] },
]

const mockRates: Rate[] = [
  { id: '1', carrierId: '1', serviceType: 'Ground', origin: 'US', destination: 'US', minWeight: 0, maxWeight: 70, rate: 8.95, fuelSurcharge: 12.5, effectiveDate: '2024-01-01', expirationDate: '2024-12-31' },
  { id: '2', carrierId: '1', serviceType: 'Next Day Air', origin: 'US', destination: 'US', minWeight: 0, maxWeight: 150, rate: 45.00, fuelSurcharge: 12.5, effectiveDate: '2024-01-01', expirationDate: '2024-12-31' },
  { id: '3', carrierId: '2', serviceType: 'Ground', origin: 'US', destination: 'US', minWeight: 0, maxWeight: 70, rate: 9.15, fuelSurcharge: 11.8, effectiveDate: '2024-01-01', expirationDate: '2024-12-31' },
  { id: '4', carrierId: '3', serviceType: 'LTL', origin: 'Northeast', destination: 'Southeast', minWeight: 100, maxWeight: 10000, rate: 85.00, fuelSurcharge: 28.5, effectiveDate: '2024-01-01', expirationDate: '2024-06-30' },
]

const performanceData = [
  { month: 'Jan', onTime: 94.5, volume: 3200 },
  { month: 'Feb', onTime: 95.2, volume: 3450 },
  { month: 'Mar', onTime: 93.8, volume: 3890 },
  { month: 'Apr', onTime: 96.1, volume: 4120 },
  { month: 'May', onTime: 95.7, volume: 4350 },
  { month: 'Jun', onTime: 94.9, volume: 4580 },
]

export default function CarrierManagement() {
  const [activeTab, setActiveTab] = useState<'carriers' | 'rates' | 'performance'>('carriers')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null)

  const getTypeBadge = (type: Carrier['type']) => {
    const styles: Record<Carrier['type'], string> = {
      ltl: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ftl: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      parcel: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      air: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      ocean: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      rail: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      courier: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    }
    return styles[type]
  }

  const getTypeIcon = (type: Carrier['type']) => {
    switch (type) {
      case 'air': return Plane
      case 'ocean': return Ship
      default: return Truck
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ))
  }

  const filteredCarriers = mockCarriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.carrierCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || carrier.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const stats = {
    totalCarriers: mockCarriers.filter(c => c.status === 'active').length,
    avgOnTimeRate: Math.round(mockCarriers.reduce((sum, c) => sum + c.onTimeRate, 0) / mockCarriers.length * 10) / 10,
    totalSpendYTD: mockCarriers.reduce((sum, c) => sum + c.spendYTD, 0),
    totalVolumeYTD: mockCarriers.reduce((sum, c) => sum + c.volumeYTD, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Carrier Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Shipping carriers, rates, and performance tracking</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Carrier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Carriers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalCarriers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg On-Time Rate</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.avgOnTimeRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">YTD Spend</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${(stats.totalSpendYTD / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">YTD Shipments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalVolumeYTD.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'carriers', label: 'Carriers', icon: Truck },
            { id: 'rates', label: 'Rate Cards', icon: DollarSign },
            { id: 'performance', label: 'Performance', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Carriers Tab */}
      {activeTab === 'carriers' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search carriers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option value="parcel">Parcel</option>
              <option value="ltl">LTL</option>
              <option value="ftl">FTL</option>
              <option value="air">Air</option>
              <option value="ocean">Ocean</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCarriers.map(carrier => {
              const TypeIcon = getTypeIcon(carrier.type)
              return (
                <div key={carrier.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{carrier.name}</h3>
                        <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{carrier.carrierCode}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(carrier.type)}`}>
                      {carrier.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(carrier.rating)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{carrier.rating}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">On-Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{carrier.onTimeRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Damage Rate</p>
                      <p className="font-medium text-gray-900 dark:text-white">{carrier.damageRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Avg Transit</p>
                      <p className="font-medium text-gray-900 dark:text-white">{carrier.avgTransitDays} days</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {carrier.services.slice(0, 3).map(service => (
                      <span key={service} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {service}
                      </span>
                    ))}
                    {carrier.services.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        +{carrier.services.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">YTD: </span>
                      <span className="font-medium text-gray-900 dark:text-white">${(carrier.spendYTD / 1000).toFixed(0)}K</span>
                      <span className="text-gray-500 dark:text-gray-400"> / </span>
                      <span className="font-medium text-gray-900 dark:text-white">{carrier.volumeYTD.toLocaleString()} shipments</span>
                    </div>
                    <button
                      onClick={() => setSelectedCarrier(carrier)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rates Tab */}
      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carrier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Origin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fuel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Effective</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {mockRates.map(rate => {
                const carrier = mockCarriers.find(c => c.id === rate.carrierId)
                return (
                  <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{carrier?.carrierCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.serviceType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.origin}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.destination}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.minWeight}-{rate.maxWeight} lbs</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${rate.rate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.fuelSurcharge}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.effectiveDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">On-Time Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} domain={[85, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line type="monotone" dataKey="onTime" name="On-Time %" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipment Volume Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="volume" name="Shipments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carrier Performance Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="pb-3">Carrier</th>
                    <th className="pb-3">Rating</th>
                    <th className="pb-3">On-Time %</th>
                    <th className="pb-3">Damage %</th>
                    <th className="pb-3">Avg Transit</th>
                    <th className="pb-3">Volume YTD</th>
                    <th className="pb-3">Spend YTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mockCarriers.sort((a, b) => b.onTimeRate - a.onTimeRate).map(carrier => (
                    <tr key={carrier.id}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{carrier.name}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {renderStars(carrier.rating)}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`font-medium ${carrier.onTimeRate >= 95 ? 'text-green-600 dark:text-green-400' : carrier.onTimeRate >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                          {carrier.onTimeRate}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{carrier.damageRate}%</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{carrier.avgTransitDays} days</td>
                      <td className="py-3 text-gray-900 dark:text-white">{carrier.volumeYTD.toLocaleString()}</td>
                      <td className="py-3 text-gray-900 dark:text-white">${(carrier.spendYTD / 1000).toFixed(0)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Carrier Detail Modal */}
      {selectedCarrier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedCarrier.carrierCode}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCarrier.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedCarrier(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1">
                {renderStars(selectedCarrier.rating)}
                <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedCarrier.rating} / 5</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedCarrier.type)}`}>
                    {selectedCarrier.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedCarrier.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                  <p className="text-gray-900 dark:text-white">{selectedCarrier.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-gray-900 dark:text-white">{selectedCarrier.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-blue-600 dark:text-blue-400">{selectedCarrier.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCarrier.services.map(service => (
                    <span key={service} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCarrier(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Carrier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
