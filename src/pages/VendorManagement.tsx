import { useState } from 'react'
import {
  Building2,
  Star,
  Search,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useVendorList } from '../hooks/useVendors'

// Extended vendor interface for UI display (API data + computed fields)
interface Vendor {
  id: string
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  rating?: number
  leadTimeDays?: number
  // UI-specific computed fields from mock for display
  fillRate?: number
  totalOrders?: number
  category?: string
}

const mockVendors: Vendor[] = [
  { id: '1', code: 'VND-001', name: 'Acme Supplies Inc', contactName: 'John Smith', email: 'jsmith@acme.com', phone: '555-0101', address: '123 Industrial Pkwy', city: 'Chicago', state: 'IL', status: 'ACTIVE', rating: 4.5, leadTimeDays: 3, fillRate: 98, totalOrders: 245, category: 'Raw Materials' },
  { id: '2', code: 'VND-002', name: 'Global Parts Ltd', contactName: 'Sarah Johnson', email: 'sjohnson@globalparts.com', phone: '555-0102', address: '456 Commerce Dr', city: 'Detroit', state: 'MI', status: 'ACTIVE', rating: 4.2, leadTimeDays: 5, fillRate: 95, totalOrders: 189, category: 'Components' },
  { id: '3', code: 'VND-003', name: 'Tech Components', contactName: 'Mike Williams', email: 'mwilliams@techcomp.com', phone: '555-0103', address: '789 Tech Blvd', city: 'Austin', state: 'TX', status: 'ACTIVE', rating: 4.8, leadTimeDays: 2, fillRate: 99, totalOrders: 312, category: 'Electronics' },
  { id: '4', code: 'VND-004', name: 'Prime Materials Co', contactName: 'Emily Davis', email: 'edavis@primemat.com', phone: '555-0104', address: '321 Supply Ave', city: 'Atlanta', state: 'GA', status: 'SUSPENDED', rating: 3.8, leadTimeDays: 7, fillRate: 88, totalOrders: 156, category: 'Raw Materials' },
  { id: '5', code: 'VND-005', name: 'Quality Goods Inc', contactName: 'James Brown', email: 'jbrown@qualitygoods.com', phone: '555-0105', address: '654 Quality Rd', city: 'Seattle', state: 'WA', status: 'ACTIVE', rating: 4.6, leadTimeDays: 4, fillRate: 97, totalOrders: 203, category: 'Packaging' },
  { id: '6', code: 'VND-006', name: 'Legacy Imports', contactName: 'Lisa Chen', email: 'lchen@legacy.com', phone: '555-0106', address: '987 Import Way', city: 'Los Angeles', state: 'CA', status: 'INACTIVE', rating: 3.5, leadTimeDays: 14, fillRate: 82, totalOrders: 45, category: 'Components' },
]

const performanceData = [
  { vendor: 'Acme', fillRate: 98, onTime: 95 },
  { vendor: 'Global', fillRate: 95, onTime: 88 },
  { vendor: 'Tech', fillRate: 99, onTime: 97 },
  { vendor: 'Prime', fillRate: 88, onTime: 78 },
  { vendor: 'Quality', fillRate: 97, onTime: 92 },
]

export default function VendorManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'performance' | 'settings'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  // Fetch vendors from API
  const { data: vendorData, isLoading, error } = useVendorList({ search: searchTerm })

  // Use API data with fallback to mock data
  const vendors: Vendor[] = vendorData?.data || mockVendors

  const getStatusBadge = (status: Vendor['status']) => {
    const styles: Record<Vendor['status'], string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter(v => v.status === 'ACTIVE').length,
    avgFillRate: Math.round(vendors.reduce((sum, v) => sum + (v.fillRate || 0), 0) / vendors.length) || 0,
    avgLeadTime: Math.round(vendors.reduce((sum, v) => sum + (v.leadTimeDays || 0), 0) / vendors.length) || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage vendor relationships and performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-700 dark:text-blue-300">Loading vendors...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 dark:text-red-300">Failed to load vendors. Showing cached data.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendors</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalVendors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeVendors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Fill Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgFillRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Lead Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgLeadTime} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Vendor List' },
            { id: 'performance', label: 'Performance' },
            { id: 'settings', label: 'Settings' },
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
              placeholder="Search vendors..."
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lead Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fill Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{vendor.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{vendor.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{vendor.contactName || '-'}</p>
                          <p className="text-gray-500 text-xs">{vendor.email || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{vendor.category || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{vendor.rating || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{vendor.leadTimeDays ? `${vendor.leadTimeDays} days` : '-'}</td>
                      <td className="px-4 py-3">
                        {vendor.fillRate !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${vendor.fillRate >= 95 ? 'bg-green-500' : vendor.fillRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${vendor.fillRate}%` }}
                              />
                            </div>
                            <span className="text-sm">{vendor.fillRate}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedVendor(vendor)}
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

      {activeTab === 'performance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Performance Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fillRate" fill="#3b82f6" name="Fill Rate %" />
                <Bar dataKey="onTime" fill="#22c55e" name="On-Time %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Settings</h3>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Fill Rate Threshold (%)
              </label>
              <input
                type="number"
                defaultValue={85}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Lead Time (days)
              </label>
              <input
                type="number"
                defaultValue={14}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoHold" className="rounded" />
              <label htmlFor="autoHold" className="text-sm text-gray-700 dark:text-gray-300">
                Auto-hold vendors below threshold
              </label>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVendor.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{selectedVendor.code}</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Contact</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedVendor.contactName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-blue-600">{selectedVendor.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedVendor.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Category</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedVendor.category || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Address</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedVendor.address ? `${selectedVendor.address}, ${selectedVendor.city || ''} ${selectedVendor.state || ''}`.trim() : '-'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.totalOrders ?? '-'}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.fillRate !== undefined ? `${selectedVendor.fillRate}%` : '-'}</p>
                  <p className="text-xs text-gray-500">Fill Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.leadTimeDays ? `${selectedVendor.leadTimeDays}d` : '-'}</p>
                  <p className="text-xs text-gray-500">Lead Time</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setSelectedVendor(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Edit Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
