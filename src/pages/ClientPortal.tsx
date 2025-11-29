import { useState } from 'react'
import {
  Users,
  Package,
  TrendingUp,
  Download,
  Search,
  Eye,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ClientAccount {
  id: string
  name: string
  accountNumber: string
  status: 'active' | 'inactive' | 'onboarding'
  skuCount: number
  inventoryUnits: number
  monthlyOrders: number
  storageUsed: number
  contractStart: string
  contractEnd: string
  primaryContact: string
  email: string
}

const mockClients: ClientAccount[] = [
  {
    id: 'CL001',
    name: 'Tech Solutions Inc',
    accountNumber: 'TECH-001',
    status: 'active',
    skuCount: 1250,
    inventoryUnits: 45000,
    monthlyOrders: 3200,
    storageUsed: 850,
    contractStart: '2023-01-01',
    contractEnd: '2025-12-31',
    primaryContact: 'John Anderson',
    email: 'john@techsolutions.com',
  },
  {
    id: 'CL002',
    name: 'Retail Partners LLC',
    accountNumber: 'RET-002',
    status: 'active',
    skuCount: 3500,
    inventoryUnits: 125000,
    monthlyOrders: 8500,
    storageUsed: 2200,
    contractStart: '2022-06-01',
    contractEnd: '2024-05-31',
    primaryContact: 'Sarah Miller',
    email: 'sarah@retailpartners.com',
  },
  {
    id: 'CL003',
    name: 'Global Imports Co',
    accountNumber: 'GLO-003',
    status: 'active',
    skuCount: 890,
    inventoryUnits: 32000,
    monthlyOrders: 1800,
    storageUsed: 520,
    contractStart: '2023-03-15',
    contractEnd: '2026-03-14',
    primaryContact: 'Michael Chen',
    email: 'mchen@globalimports.com',
  },
  {
    id: 'CL004',
    name: 'Startup Ventures',
    accountNumber: 'STV-004',
    status: 'onboarding',
    skuCount: 150,
    inventoryUnits: 5000,
    monthlyOrders: 0,
    storageUsed: 45,
    contractStart: '2024-01-15',
    contractEnd: '2025-01-14',
    primaryContact: 'Emma Wilson',
    email: 'emma@startupventures.io',
  },
  {
    id: 'CL005',
    name: 'Heritage Brands',
    accountNumber: 'HER-005',
    status: 'inactive',
    skuCount: 0,
    inventoryUnits: 0,
    monthlyOrders: 0,
    storageUsed: 0,
    contractStart: '2022-01-01',
    contractEnd: '2023-12-31',
    primaryContact: 'Robert Brown',
    email: 'rbrown@heritagebrands.com',
  },
]

const orderVolumeData = [
  { month: 'Aug', orders: 12500 },
  { month: 'Sep', orders: 13200 },
  { month: 'Oct', orders: 14800 },
  { month: 'Nov', orders: 18500 },
  { month: 'Dec', orders: 22000 },
  { month: 'Jan', orders: 15200 },
]

const clientPerformanceData = [
  { client: 'Tech Solutions', accuracy: 99.8, onTime: 98.5 },
  { client: 'Retail Partners', accuracy: 99.5, onTime: 97.2 },
  { client: 'Global Imports', accuracy: 99.9, onTime: 99.1 },
]

export default function ClientPortal() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null)
  const [activeTab, setActiveTab] = useState<'clients' | 'performance' | 'billing'>('clients')

  const getStatusBadge = (status: ClientAccount['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      onboarding: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredClients = mockClients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalClients: mockClients.filter(c => c.status === 'active').length,
    totalSKUs: mockClients.reduce((sum, c) => sum + c.skuCount, 0),
    totalInventory: mockClients.reduce((sum, c) => sum + c.inventoryUnits, 0),
    totalOrders: mockClients.reduce((sum, c) => sum + c.monthlyOrders, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage 3PL client accounts and visibility</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Users className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalClients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalSKUs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Units</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalInventory.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'clients', label: 'Client Accounts' },
            { id: 'performance', label: 'Performance Metrics' },
            { id: 'billing', label: 'Billing Summary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'clients' | 'performance' | 'billing')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'clients' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.accountNumber}</p>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">SKUs</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.skuCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Inventory</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.inventoryUnits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monthly Orders</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.monthlyOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Storage (pallets)</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.storageUsed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Volume Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#3B82F6" fill="#93C5FD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis type="number" domain={[95, 100]} />
                  <YAxis dataKey="client" type="category" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="onTime" fill="#3B82F6" name="On-Time %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockClients.filter(c => c.status === 'active').slice(0, 3).map((client) => (
              <div key={client.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{client.name}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Order Accuracy
                    </div>
                    <span className="font-medium text-green-600">99.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Truck className="w-4 h-4 text-blue-500" />
                      On-Time Shipping
                    </div>
                    <span className="font-medium text-blue-600">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 text-purple-500" />
                      Avg Processing
                    </div>
                    <span className="font-medium">2.4 hrs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">$127,450</p>
              <p className="text-sm text-gray-500 mt-1">+12% from last month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Pending Invoices</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">8</p>
              <p className="text-sm text-gray-500 mt-1">$45,200 total</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Avg Revenue/Client</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$42,483</p>
              <p className="text-sm text-gray-500 mt-1">Per month</p>
            </div>
          </div>

          {/* Billing Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Handling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Value-Add
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockClients.filter(c => c.status === 'active').map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      ${(client.storageUsed * 12).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      ${(client.monthlyOrders * 2.5).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">$1,250</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      ${((client.storageUsed * 12) + (client.monthlyOrders * 2.5) + 1250).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h2>
                  <p className="text-gray-500">{selectedClient.accountNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedClient.status)}
                <span className="text-sm text-gray-500">
                  Contract: {selectedClient.contractStart} to {selectedClient.contractEnd}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Primary Contact</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedClient.primaryContact}</p>
                  <p className="text-sm text-blue-600">{selectedClient.email}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedClient.storageUsed} <span className="text-sm font-normal">pallets</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedClient.skuCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Active SKUs</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedClient.inventoryUnits.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Units on Hand</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedClient.monthlyOrders.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Monthly Orders</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Inventory
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
