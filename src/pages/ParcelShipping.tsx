import { useState } from 'react'
import {
  Package,
  Truck,
  Search,
  Printer,
  DollarSign,
  Clock,
  CheckCircle,
  Eye,
  Scale,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Shipment {
  id: string
  trackingNumber: string
  orderNumber: string
  carrier: string
  service: string
  status: 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'
  shipDate: string
  deliveryDate?: string
  estimatedDelivery: string
  weight: number
  dimensions: string
  zone: string
  cost: number
  recipientName: string
  recipientCity: string
  recipientState: string
}

interface Rate {
  carrier: string
  service: string
  deliveryDays: string
  cost: number
  listPrice: number
  savings: number
}

const mockShipments: Shipment[] = [
  { id: '1', trackingNumber: '1Z999AA10123456784', orderNumber: 'ORD-2024-5001', carrier: 'UPS', service: 'Ground', status: 'in_transit', shipDate: '2024-01-14', estimatedDelivery: '2024-01-18', weight: 5.2, dimensions: '12x8x6', zone: '5', cost: 12.45, recipientName: 'John Smith', recipientCity: 'Chicago', recipientState: 'IL' },
  { id: '2', trackingNumber: '794644790145', orderNumber: 'ORD-2024-5002', carrier: 'FedEx', service: 'Express', status: 'delivered', shipDate: '2024-01-13', deliveryDate: '2024-01-14', estimatedDelivery: '2024-01-14', weight: 2.1, dimensions: '10x6x4', zone: '3', cost: 28.90, recipientName: 'Sarah Johnson', recipientCity: 'Boston', recipientState: 'MA' },
  { id: '3', trackingNumber: '9400111899223033005436', orderNumber: 'ORD-2024-5003', carrier: 'USPS', service: 'Priority Mail', status: 'out_for_delivery', shipDate: '2024-01-13', estimatedDelivery: '2024-01-15', weight: 1.5, dimensions: '8x6x4', zone: '4', cost: 8.70, recipientName: 'Mike Wilson', recipientCity: 'Denver', recipientState: 'CO' },
  { id: '4', trackingNumber: '1Z999AA10123456785', orderNumber: 'ORD-2024-5004', carrier: 'UPS', service: '2nd Day Air', status: 'label_created', shipDate: '2024-01-15', estimatedDelivery: '2024-01-17', weight: 8.4, dimensions: '16x12x10', zone: '6', cost: 35.20, recipientName: 'Emily Davis', recipientCity: 'Seattle', recipientState: 'WA' },
  { id: '5', trackingNumber: '794644790146', orderNumber: 'ORD-2024-5005', carrier: 'FedEx', service: 'Ground', status: 'exception', shipDate: '2024-01-12', estimatedDelivery: '2024-01-16', weight: 3.8, dimensions: '14x10x8', zone: '7', cost: 15.60, recipientName: 'James Brown', recipientCity: 'Miami', recipientState: 'FL' },
  { id: '6', trackingNumber: '1Z999AA10123456786', orderNumber: 'ORD-2024-5006', carrier: 'UPS', service: 'Next Day Air', status: 'picked_up', shipDate: '2024-01-15', estimatedDelivery: '2024-01-16', weight: 0.8, dimensions: '6x4x3', zone: '2', cost: 45.80, recipientName: 'Lisa Chen', recipientCity: 'New York', recipientState: 'NY' },
]

const mockRates: Rate[] = [
  { carrier: 'UPS', service: 'Ground', deliveryDays: '5-7 days', cost: 12.45, listPrice: 15.99, savings: 22 },
  { carrier: 'UPS', service: '2nd Day Air', deliveryDays: '2 days', cost: 28.50, listPrice: 35.99, savings: 21 },
  { carrier: 'UPS', service: 'Next Day Air', deliveryDays: '1 day', cost: 45.80, listPrice: 58.99, savings: 22 },
  { carrier: 'FedEx', service: 'Ground', deliveryDays: '5-7 days', cost: 11.95, listPrice: 14.99, savings: 20 },
  { carrier: 'FedEx', service: 'Express Saver', deliveryDays: '3 days', cost: 22.40, listPrice: 28.99, savings: 23 },
  { carrier: 'FedEx', service: 'Priority Overnight', deliveryDays: '1 day', cost: 52.30, listPrice: 65.99, savings: 21 },
  { carrier: 'USPS', service: 'Priority Mail', deliveryDays: '2-3 days', cost: 8.70, listPrice: 9.50, savings: 8 },
  { carrier: 'USPS', service: 'First Class', deliveryDays: '3-5 days', cost: 4.25, listPrice: 4.75, savings: 11 },
]

const dailyVolume = [
  { date: 'Mon', shipments: 145, cost: 1890 },
  { date: 'Tue', shipments: 168, cost: 2240 },
  { date: 'Wed', shipments: 189, cost: 2560 },
  { date: 'Thu', shipments: 156, cost: 2100 },
  { date: 'Fri', shipments: 210, cost: 2890 },
  { date: 'Sat', shipments: 85, cost: 980 },
]

const carrierBreakdown = [
  { carrier: 'UPS', volume: 450, spend: 6200 },
  { carrier: 'FedEx', volume: 320, spend: 5100 },
  { carrier: 'USPS', volume: 180, spend: 1400 },
]

export default function ParcelShipping() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'rates' | 'analytics'>('shipments')
  const [searchTerm, setSearchTerm] = useState('')
  const [carrierFilter, setCarrierFilter] = useState('All')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const getStatusBadge = (status: Shipment['status']) => {
    const styles = {
      label_created: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      picked_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_transit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      out_for_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      exception: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return styles[status]
  }

  const getCarrierLogo = (carrier: string) => {
    const colors: Record<string, string> = {
      UPS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      FedEx: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      USPS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return colors[carrier] || 'bg-gray-100 text-gray-800'
  }

  const filteredShipments = mockShipments.filter(ship => {
    const matchesSearch = ship.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCarrier = carrierFilter === 'All' || ship.carrier === carrierFilter
    return matchesSearch && matchesCarrier
  })

  const stats = {
    todayShipments: mockShipments.length,
    inTransit: mockShipments.filter(s => s.status === 'in_transit' || s.status === 'picked_up').length,
    delivered: mockShipments.filter(s => s.status === 'delivered').length,
    avgCost: Math.round(mockShipments.reduce((sum, s) => sum + s.cost, 0) / mockShipments.length * 100) / 100,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parcel Shipping</h1>
          <p className="text-gray-600 dark:text-gray-400">Small parcel rate shopping and label generation</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Printer className="w-4 h-4" />
            Batch Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Package className="w-4 h-4" />
            Ship Package
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Shipments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.todayShipments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cost</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">${stats.avgCost}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'shipments', label: 'Shipments', icon: Package },
            { id: 'rates', label: 'Rate Shopping', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: Clock },
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

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tracking or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>USPS</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carrier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Est. Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredShipments.map(ship => (
                  <tr key={ship.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 dark:text-blue-400">
                      {ship.trackingNumber.substring(0, 15)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ship.orderNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCarrierLogo(ship.carrier)}`}>
                        {ship.carrier} {ship.service}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ship.status)}`}>
                        {ship.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {ship.recipientCity}, {ship.recipientState}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{ship.estimatedDelivery}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${ship.cost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedShipment(ship)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rate Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Weight (lbs)</label>
                <div className="relative">
                  <Scale className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Dimensions (LxWxH)</label>
                <input
                  type="text"
                  placeholder="12x8x6"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Destination ZIP</label>
                <input
                  type="text"
                  placeholder="90210"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Get Rates
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carrier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">List Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Your Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Savings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {mockRates.map((rate, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCarrierLogo(rate.carrier)}`}>
                        {rate.carrier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rate.service}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rate.deliveryDays}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 line-through">${rate.listPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">${rate.cost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                        {rate.savings}% off
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Shipping Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="shipments" name="Shipments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipping Cost Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`$${value}`, 'Cost']}
                />
                <Line type="monotone" dataKey="cost" name="Cost ($)" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carrier Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              {carrierBreakdown.map(carrier => (
                <div key={carrier.carrier} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCarrierLogo(carrier.carrier)}`}>
                      {carrier.carrier}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
                      <span className="font-bold text-gray-900 dark:text-white">{carrier.volume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Spend</span>
                      <span className="font-bold text-gray-900 dark:text-white">${carrier.spend.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Cost</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ${(carrier.spend / carrier.volume).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedShipment.orderNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedShipment.carrier} {selectedShipment.service}</h2>
                </div>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tracking Number</p>
                <p className="text-gray-900 dark:text-white font-mono">{selectedShipment.trackingNumber}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedShipment.status)}`}>
                  {selectedShipment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ship Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedShipment.shipDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Est. Delivery</p>
                  <p className="text-gray-900 dark:text-white">{selectedShipment.estimatedDelivery}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                  <p className="text-gray-900 dark:text-white">{selectedShipment.weight} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dimensions</p>
                  <p className="text-gray-900 dark:text-white">{selectedShipment.dimensions}"</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Zone</p>
                  <p className="text-gray-900 dark:text-white">{selectedShipment.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cost</p>
                  <p className="text-gray-900 dark:text-white font-bold">${selectedShipment.cost.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recipient</p>
                <p className="text-gray-900 dark:text-white">{selectedShipment.recipientName}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedShipment.recipientCity}, {selectedShipment.recipientState}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Printer className="w-4 h-4" />
                Reprint Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
