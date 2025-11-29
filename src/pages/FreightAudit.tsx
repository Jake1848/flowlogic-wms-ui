import { useState } from 'react'
import {
  Scale,
  Search,
  Filter,
  Download,
  DollarSign,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  FileText,
  Truck,
  Clock,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface FreightInvoice {
  id: string
  invoiceNumber: string
  carrier: string
  invoiceDate: string
  dueDate: string
  billedAmount: number
  auditedAmount: number
  variance: number
  status: 'pending' | 'approved' | 'disputed' | 'paid' | 'rejected'
  shipments: number
  discrepancies: {
    type: string
    amount: number
    description: string
  }[]
}

const mockInvoices: FreightInvoice[] = [
  {
    id: 'FI001',
    invoiceNumber: 'INV-2024-8876',
    carrier: 'FedEx Ground',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    billedAmount: 15420.50,
    auditedAmount: 14850.25,
    variance: -570.25,
    status: 'disputed',
    shipments: 234,
    discrepancies: [
      { type: 'Weight Adjustment', amount: -320.50, description: 'Dimensional weight overcharge on 12 shipments' },
      { type: 'Duplicate Charge', amount: -180.00, description: 'Duplicate accessorial on shipment #45678' },
      { type: 'Wrong Rate', amount: -69.75, description: 'Zone 5 rate applied instead of Zone 4' },
    ],
  },
  {
    id: 'FI002',
    invoiceNumber: 'INV-2024-4532',
    carrier: 'UPS',
    invoiceDate: '2024-01-18',
    dueDate: '2024-02-18',
    billedAmount: 22150.00,
    auditedAmount: 22150.00,
    variance: 0,
    status: 'approved',
    shipments: 312,
    discrepancies: [],
  },
  {
    id: 'FI003',
    invoiceNumber: 'INV-2024-7789',
    carrier: 'XPO Logistics',
    invoiceDate: '2024-01-20',
    dueDate: '2024-02-20',
    billedAmount: 45680.00,
    auditedAmount: 43250.00,
    variance: -2430.00,
    status: 'pending',
    shipments: 45,
    discrepancies: [
      { type: 'Accessorial Overcharge', amount: -1200.00, description: 'Liftgate charges on dock deliveries' },
      { type: 'Class Correction', amount: -850.00, description: 'FAK agreement not applied' },
      { type: 'Fuel Surcharge', amount: -380.00, description: 'Incorrect fuel surcharge percentage' },
    ],
  },
  {
    id: 'FI004',
    invoiceNumber: 'INV-2024-2234',
    carrier: 'USPS',
    invoiceDate: '2024-01-10',
    dueDate: '2024-02-10',
    billedAmount: 3450.25,
    auditedAmount: 3450.25,
    variance: 0,
    status: 'paid',
    shipments: 856,
    discrepancies: [],
  },
  {
    id: 'FI005',
    invoiceNumber: 'INV-2024-9901',
    carrier: 'DHL Express',
    invoiceDate: '2024-01-22',
    dueDate: '2024-02-22',
    billedAmount: 8920.00,
    auditedAmount: 8650.00,
    variance: -270.00,
    status: 'pending',
    shipments: 67,
    discrepancies: [
      { type: 'Late Delivery Credit', amount: -270.00, description: 'Service guarantee refund for 3 shipments' },
    ],
  },
]

const savingsData = [
  { month: 'Aug', savings: 2340 },
  { month: 'Sep', savings: 3150 },
  { month: 'Oct', savings: 2890 },
  { month: 'Nov', savings: 4120 },
  { month: 'Dec', savings: 3670 },
  { month: 'Jan', savings: 3270 },
]

const discrepancyTypes = [
  { name: 'Weight/Dim', value: 35, color: '#3B82F6' },
  { name: 'Accessorial', value: 28, color: '#10B981' },
  { name: 'Fuel Surcharge', value: 18, color: '#F59E0B' },
  { name: 'Rate Errors', value: 12, color: '#EF4444' },
  { name: 'Duplicates', value: 7, color: '#8B5CF6' },
]

export default function FreightAudit() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<FreightInvoice | null>(null)
  const [activeTab, setActiveTab] = useState<'invoices' | 'analytics' | 'disputes'>('invoices')

  const getStatusBadge = (status: FreightInvoice['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      disputed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.carrier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalBilled = mockInvoices.reduce((sum, inv) => sum + inv.billedAmount, 0)
  const totalAudited = mockInvoices.reduce((sum, inv) => sum + inv.auditedAmount, 0)
  const totalSavings = totalBilled - totalAudited
  const pendingDisputes = mockInvoices.filter((inv) => inv.status === 'disputed' || inv.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Freight Audit</h1>
          <p className="text-gray-600 dark:text-gray-400">Audit carrier invoices and recover overcharges</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText className="w-4 h-4" />
            Upload Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Billed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Savings</p>
              <p className="text-xl font-bold text-green-600">
                ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {((totalSavings / totalBilled) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{pendingDisputes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'invoices', label: 'Invoices' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'disputes', label: 'Disputes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'invoices' | 'analytics' | 'disputes')}
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

      {activeTab === 'invoices' && (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disputed">Disputed</option>
              <option value="paid">Paid</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Billed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Audited
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">{invoice.shipments} shipments</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{invoice.carrier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      ${invoice.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      ${invoice.auditedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={invoice.variance < 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {invoice.variance < 0 ? '-' : ''}$
                        {Math.abs(invoice.variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {invoice.dueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Savings Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Savings']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="savings" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Discrepancy Types</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={discrepancyTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {discrepancyTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {discrepancyTypes.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {type.name} ({type.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Savings by Carrier</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['FedEx', 'UPS', 'XPO Logistics', 'DHL'].map((carrier, index) => (
                <div key={carrier} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{carrier}</p>
                  <p className="text-xl font-bold text-green-600">
                    ${[570, 0, 2430, 270][index].toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {mockInvoices
            .filter((inv) => inv.discrepancies.length > 0)
            .map((invoice) => (
              <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-500">{invoice.carrier}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(invoice.status)}
                    <span className="text-lg font-bold text-green-600">
                      -${Math.abs(invoice.variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {invoice.discrepancies.map((disc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{disc.type}</span>
                        <p className="text-sm text-gray-500">{disc.description}</p>
                      </div>
                      <span className="text-green-600 font-medium">
                        -${Math.abs(disc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Details</h2>
                  <p className="text-gray-500">{selectedInvoice.invoiceNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Carrier</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedInvoice.carrier}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Billed Amount</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${selectedInvoice.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Audited Amount</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${selectedInvoice.auditedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {selectedInvoice.discrepancies.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Discrepancies Found</h3>
                  <div className="space-y-2">
                    {selectedInvoice.discrepancies.map((disc, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-800 dark:text-red-400">{disc.type}</span>
                          <span className="text-green-600 font-medium">
                            -${Math.abs(disc.amount).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{disc.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Approve
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
