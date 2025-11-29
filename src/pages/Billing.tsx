import { useState } from 'react'
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Download,
  Send,
  Calendar,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  customerId: string
  period: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'disputed'
  subtotal: number
  taxes: number
  total: number
  paidAmount: number
}

interface BillingLine {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  chargeType: 'storage' | 'handling' | 'shipping' | 'labor' | 'other'
}

const mockInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-2024-0125', customer: 'ABC Retail Corp', customerId: 'CUST-001', period: 'Jan 1-15, 2024', issueDate: '2024-01-16', dueDate: '2024-02-15', status: 'sent', subtotal: 12500, taxes: 1062.50, total: 13562.50, paidAmount: 0 },
  { id: '2', invoiceNumber: 'INV-2024-0124', customer: 'XYZ Distribution', customerId: 'CUST-002', period: 'Jan 1-15, 2024', issueDate: '2024-01-16', dueDate: '2024-02-15', status: 'pending', subtotal: 8750, taxes: 743.75, total: 9493.75, paidAmount: 0 },
  { id: '3', invoiceNumber: 'INV-2024-0120', customer: 'Quick Commerce LLC', customerId: 'CUST-003', period: 'Dec 16-31, 2023', issueDate: '2024-01-02', dueDate: '2024-02-01', status: 'paid', subtotal: 15200, taxes: 1292.00, total: 16492.00, paidAmount: 16492.00 },
  { id: '4', invoiceNumber: 'INV-2024-0118', customer: 'MegaStore Inc', customerId: 'CUST-004', period: 'Dec 16-31, 2023', issueDate: '2024-01-02', dueDate: '2024-02-01', status: 'overdue', subtotal: 22400, taxes: 1904.00, total: 24304.00, paidAmount: 0 },
  { id: '5', invoiceNumber: 'INV-2024-0126', customer: 'FastShip Co', customerId: 'CUST-005', period: 'Jan 1-15, 2024', issueDate: '2024-01-16', dueDate: '2024-02-15', status: 'draft', subtotal: 6800, taxes: 578.00, total: 7378.00, paidAmount: 0 },
]

const mockLines: BillingLine[] = [
  { id: '1', description: 'Pallet Storage (250 pallets x 15 days)', quantity: 3750, rate: 0.85, amount: 3187.50, chargeType: 'storage' },
  { id: '2', description: 'Inbound Handling (45 receipts)', quantity: 45, rate: 25.00, amount: 1125.00, chargeType: 'handling' },
  { id: '3', description: 'Outbound Order Processing (320 orders)', quantity: 320, rate: 8.50, amount: 2720.00, chargeType: 'handling' },
  { id: '4', description: 'Pick & Pack Labor (480 lines)', quantity: 480, rate: 2.25, amount: 1080.00, chargeType: 'labor' },
  { id: '5', description: 'Shipping Labels & BOL', quantity: 320, rate: 0.75, amount: 240.00, chargeType: 'shipping' },
  { id: '6', description: 'Value-Added Services (Kitting)', quantity: 150, rate: 5.50, amount: 825.00, chargeType: 'other' },
]

const monthlyRevenue = [
  { month: 'Aug', revenue: 85000, projected: 80000 },
  { month: 'Sep', revenue: 92000, projected: 85000 },
  { month: 'Oct', revenue: 105000, projected: 95000 },
  { month: 'Nov', revenue: 118000, projected: 110000 },
  { month: 'Dec', revenue: 135000, projected: 125000 },
  { month: 'Jan', revenue: 98000, projected: 100000 },
]

const chargeBreakdown = [
  { type: 'Storage', amount: 45000, percentage: 35 },
  { type: 'Handling', amount: 38000, percentage: 30 },
  { type: 'Labor', amount: 28000, percentage: 22 },
  { type: 'Shipping', amount: 10000, percentage: 8 },
  { type: 'Other', amount: 7000, percentage: 5 },
]

export default function Billing() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'details' | 'rates' | 'analytics'>('invoices')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>('INV-2024-0125')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
    }
    return styles[status]
  }

  const filteredInvoices = mockInvoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    outstanding: mockInvoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total - i.paidAmount, 0),
    overdue: mockInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
    paidThisMonth: mockInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.paidAmount, 0),
    pendingApproval: mockInvoices.filter(i => ['draft', 'pending'].includes(i.status)).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">3PL Billing</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer invoicing and billing</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-4 h-4" />
            Generate Period
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.outstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.overdue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid This Month</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.paidThisMonth.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pendingApproval}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'invoices', label: 'Invoices' },
            { id: 'details', label: 'Line Details' },
            { id: 'rates', label: 'Rate Card' },
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
      {activeTab === 'invoices' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices..."
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => { setSelectedInvoice(inv.invoiceNumber); setActiveTab('details'); }}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedInvoice === inv.invoiceNumber ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{inv.customer}</p>
                          <p className="text-xs text-gray-500">{inv.customerId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{inv.period}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{inv.dueDate}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        ${inv.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        ${(inv.total - inv.paidAmount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Download">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Send">
                            <Send className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
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
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedInvoice}</h3>
                <p className="text-sm text-gray-500">ABC Retail Corp | Period: Jan 1-15, 2024</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send className="w-4 h-4" />
                  Send Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockLines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.description}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${
                          line.chargeType === 'storage' ? 'bg-blue-100 text-blue-800' :
                          line.chargeType === 'handling' ? 'bg-green-100 text-green-800' :
                          line.chargeType === 'labor' ? 'bg-purple-100 text-purple-800' :
                          line.chargeType === 'shipping' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {line.chargeType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{line.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${line.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${line.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">Subtotal</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">$9,177.50</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">Tax (8.5%)</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">$780.09</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">$9,957.59</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standard Rate Card</h3>
          <div className="space-y-4">
            {[
              { category: 'Storage', rates: [{ name: 'Pallet Storage (per pallet/day)', rate: '$0.85' }, { name: 'Bin Storage (per bin/day)', rate: '$0.25' }, { name: 'Floor Storage (per sq ft/day)', rate: '$0.15' }] },
              { category: 'Handling', rates: [{ name: 'Inbound - Per Receipt', rate: '$25.00' }, { name: 'Outbound - Per Order', rate: '$8.50' }, { name: 'Cross-dock - Per Pallet', rate: '$12.00' }] },
              { category: 'Labor', rates: [{ name: 'Pick per Line', rate: '$2.25' }, { name: 'Pack per Order', rate: '$1.50' }, { name: 'Kitting per Kit', rate: '$5.50' }] },
            ].map((section) => (
              <div key={section.category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{section.category}</h4>
                <div className="space-y-2">
                  {section.rates.map((rate) => (
                    <div key={rate.name} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{rate.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{rate.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="projected" stroke="#9ca3af" strokeDasharray="5 5" name="Projected" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Charge Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargeBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={80} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
