import { useState } from 'react'
import {
  Users,
  Building,
  MapPin,
  Search,
  Plus,
  Edit,
  CheckCircle,
  TrendingUp,
  Package,
  Truck,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Customer {
  id: string
  customerCode: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  status: 'active' | 'inactive' | 'on_hold' | 'pending'
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  orderVolume: number
  avgOrderValue: number
  onTimeDelivery: number
  shippingPreference: string
  paymentTerms: string
}

interface ShippingAddress {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  isDefault: boolean
  deliveryInstructions: string
}

const mockCustomers: Customer[] = [
  { id: '1', customerCode: 'CUST-001', name: 'ABC Retail Corp', contact: 'John Smith', email: 'jsmith@abcretail.com', phone: '555-0101', address: '123 Commerce St', city: 'Chicago', state: 'IL', status: 'active', tier: 'platinum', orderVolume: 1250, avgOrderValue: 2450, onTimeDelivery: 98, shippingPreference: 'Ground', paymentTerms: 'Net 30' },
  { id: '2', customerCode: 'CUST-002', name: 'XYZ Distribution', contact: 'Sarah Johnson', email: 'sjohnson@xyz.com', phone: '555-0102', address: '456 Warehouse Ave', city: 'Detroit', state: 'MI', status: 'active', tier: 'gold', orderVolume: 850, avgOrderValue: 1800, onTimeDelivery: 95, shippingPreference: '2-Day', paymentTerms: 'Net 15' },
  { id: '3', customerCode: 'CUST-003', name: 'Quick Commerce LLC', contact: 'Mike Williams', email: 'mwilliams@quickcom.com', phone: '555-0103', address: '789 Express Blvd', city: 'Indianapolis', state: 'IN', status: 'active', tier: 'silver', orderVolume: 420, avgOrderValue: 950, onTimeDelivery: 92, shippingPreference: 'Ground', paymentTerms: 'Net 30' },
  { id: '4', customerCode: 'CUST-004', name: 'MegaStore Inc', contact: 'Emily Davis', email: 'edavis@megastore.com', phone: '555-0104', address: '321 Big Box Way', city: 'Columbus', state: 'OH', status: 'on_hold', tier: 'gold', orderVolume: 680, avgOrderValue: 3200, onTimeDelivery: 88, shippingPreference: 'LTL', paymentTerms: 'Net 45' },
  { id: '5', customerCode: 'CUST-005', name: 'FastShip Co', contact: 'James Brown', email: 'jbrown@fastship.com', phone: '555-0105', address: '654 Speed Lane', city: 'Louisville', state: 'KY', status: 'active', tier: 'platinum', orderVolume: 1580, avgOrderValue: 1650, onTimeDelivery: 99, shippingPreference: 'Next Day', paymentTerms: 'Net 15' },
  { id: '6', customerCode: 'CUST-006', name: 'Budget Buyers', contact: 'Lisa Chen', email: 'lchen@budgetbuyers.com', phone: '555-0106', address: '987 Discount Dr', city: 'Cincinnati', state: 'OH', status: 'inactive', tier: 'bronze', orderVolume: 125, avgOrderValue: 450, onTimeDelivery: 85, shippingPreference: 'Ground', paymentTerms: 'COD' },
]

const mockAddresses: ShippingAddress[] = [
  { id: '1', name: 'Main Warehouse', address: '123 Commerce St', city: 'Chicago', state: 'IL', zip: '60601', isDefault: true, deliveryInstructions: 'Dock 5, call before arrival' },
  { id: '2', name: 'East Distribution', address: '456 Industrial Pkwy', city: 'Chicago', state: 'IL', zip: '60602', isDefault: false, deliveryInstructions: 'Mon-Fri 8AM-5PM only' },
  { id: '3', name: 'Store #142', address: '789 Retail Ave', city: 'Naperville', state: 'IL', zip: '60540', isDefault: false, deliveryInstructions: 'Back entrance, limited hours' },
]

const orderVolumeData = [
  { month: 'Aug', orders: 185 },
  { month: 'Sep', orders: 210 },
  { month: 'Oct', orders: 245 },
  { month: 'Nov', orders: 320 },
  { month: 'Dec', orders: 380 },
  { month: 'Jan', orders: 195 },
]

export default function CustomerManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const getTierBadge = (tier: Customer['tier']) => {
    const styles = {
      platinum: 'bg-purple-100 text-purple-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-200 text-gray-800',
      bronze: 'bg-orange-100 text-orange-800',
    }
    return styles[tier]
  }

  const getStatusBadge = (status: Customer['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return styles[status]
  }

  const filteredCustomers = mockCustomers.filter(cust =>
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalCustomers: mockCustomers.length,
    activeCustomers: mockCustomers.filter(c => c.status === 'active').length,
    totalOrders: mockCustomers.reduce((sum, c) => sum + c.orderVolume, 0),
    avgOnTime: Math.round(mockCustomers.reduce((sum, c) => sum + c.onTimeDelivery, 0) / mockCustomers.length),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer accounts and preferences</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg On-Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgOnTime}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Customer List' },
            { id: 'details', label: 'Customer Details' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">On-Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{cust.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{cust.customerCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {cust.city}, {cust.state}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getTierBadge(cust.tier)}`}>
                          {cust.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cust.orderVolume.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${cust.avgOrderValue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${cust.onTimeDelivery >= 95 ? 'bg-green-500' : cust.onTimeDelivery >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${cust.onTimeDelivery}%` }}
                            />
                          </div>
                          <span className="text-sm">{cust.onTimeDelivery}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(cust.status)}`}>
                          {cust.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedCustomer(cust); setActiveTab('details'); }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedCustomer?.name || 'ABC Retail Corp'}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedCustomer?.customerCode || 'CUST-001'}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm capitalize ${getTierBadge(selectedCustomer?.tier || 'platinum')}`}>
                  {selectedCustomer?.tier || 'platinum'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.contact || 'John Smith'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-blue-600">{selectedCustomer?.email || 'jsmith@abcretail.com'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.phone || '555-0101'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Terms</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.paymentTerms || 'Net 30'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Shipping Preference</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.shippingPreference || 'Ground'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(selectedCustomer?.status || 'active')}`}>
                    {selectedCustomer?.status || 'active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Shipping Addresses</h4>
              <div className="space-y-3">
                {mockAddresses.map((addr) => (
                  <div key={addr.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{addr.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{addr.address}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{addr.city}, {addr.state} {addr.zip}</p>
                          {addr.deliveryInstructions && (
                            <p className="text-xs text-gray-500 mt-1">Note: {addr.deliveryInstructions}</p>
                          )}
                        </div>
                      </div>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Default</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Avg Order Value</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">$2,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">On-Time Delivery</span>
                  <span className="text-sm font-medium text-green-600">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Returns Rate</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">2.3%</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  View Orders
                </button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Track Shipments
                </button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Volume Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
