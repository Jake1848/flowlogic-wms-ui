import { useState, useMemo } from 'react'
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
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useCustomerList, type Customer } from '../hooks/useCustomers'

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

// Fallback mock data for when API is unavailable
const mockCustomers = [
  { id: '1', code: 'CUST-001', name: 'ABC Retail Corp', contactName: 'John Smith', email: 'jsmith@abcretail.com', phone: '555-0101', shippingAddress: '123 Commerce St', city: 'Chicago', state: 'IL', status: 'ACTIVE' as const, paymentTerms: 'Net 30', createdAt: '', updatedAt: '' },
  { id: '2', code: 'CUST-002', name: 'XYZ Distribution', contactName: 'Sarah Johnson', email: 'sjohnson@xyz.com', phone: '555-0102', shippingAddress: '456 Warehouse Ave', city: 'Detroit', state: 'MI', status: 'ACTIVE' as const, paymentTerms: 'Net 15', createdAt: '', updatedAt: '' },
  { id: '3', code: 'CUST-003', name: 'Quick Commerce LLC', contactName: 'Mike Williams', email: 'mwilliams@quickcom.com', phone: '555-0103', shippingAddress: '789 Express Blvd', city: 'Indianapolis', state: 'IN', status: 'ACTIVE' as const, paymentTerms: 'Net 30', createdAt: '', updatedAt: '' },
  { id: '4', code: 'CUST-004', name: 'MegaStore Inc', contactName: 'Emily Davis', email: 'edavis@megastore.com', phone: '555-0104', shippingAddress: '321 Big Box Way', city: 'Columbus', state: 'OH', status: 'SUSPENDED' as const, paymentTerms: 'Net 45', createdAt: '', updatedAt: '' },
  { id: '5', code: 'CUST-005', name: 'FastShip Co', contactName: 'James Brown', email: 'jbrown@fastship.com', phone: '555-0105', shippingAddress: '654 Speed Lane', city: 'Louisville', state: 'KY', status: 'ACTIVE' as const, paymentTerms: 'Net 15', createdAt: '', updatedAt: '' },
  { id: '6', code: 'CUST-006', name: 'Budget Buyers', contactName: 'Lisa Chen', email: 'lchen@budgetbuyers.com', phone: '555-0106', shippingAddress: '987 Discount Dr', city: 'Cincinnati', state: 'OH', status: 'INACTIVE' as const, paymentTerms: 'COD', createdAt: '', updatedAt: '' },
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

  // Use real API data with fallback to mock
  const { data: customerData, isLoading, error } = useCustomerList({ search: searchTerm })
  const customers = customerData?.data || mockCustomers

  const getStatusBadge = (status: Customer['status']) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust =>
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  }, [customers, searchTerm])

  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'ACTIVE').length,
    totalOrders: customers.length * 150, // Placeholder since orders are in a separate table
    avgOnTime: 94, // Would come from analytics endpoint
  }), [customers])

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

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading customers...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>Unable to load from server. Showing demo data.</span>
            </div>
          )}

          {!isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payment Terms</th>
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
                          <p className="text-xs text-gray-500 font-mono">{cust.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{cust.contactName || '-'}</p>
                          <p className="text-xs text-gray-500">{cust.email || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {cust.city && cust.state ? `${cust.city}, ${cust.state}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cust.paymentTerms || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(cust.status)}`}>
                          {cust.status}
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
          )}
        </>
      )}

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedCustomer?.name || 'Select a customer'}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedCustomer?.code || '-'}</p>
                </div>
                {selectedCustomer && (
                  <span className={`px-3 py-1 rounded text-sm ${getStatusBadge(selectedCustomer.status)}`}>
                    {selectedCustomer.status}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.contactName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-blue-600">{selectedCustomer?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Terms</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.paymentTerms || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Preferred Carrier</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.preferredCarrier || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Credit Limit</p>
                  <p className="text-gray-900 dark:text-white">{selectedCustomer?.creditLimit ? `$${selectedCustomer.creditLimit.toLocaleString()}` : '-'}</p>
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
