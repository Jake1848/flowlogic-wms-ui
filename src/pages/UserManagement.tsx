import { useState } from 'react'
import {
  Users,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Edit,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useUserList, type User as APIUser } from '../hooks/useUsers'

// Extended UI interface (API data + computed fields)
interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  department: string
  phone: string
  status: 'active' | 'inactive' | 'locked'
  lastLogin: string
  createdAt: string
  permissions: string[]
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

const PERMISSIONS = [
  { id: 'inventory.view', label: 'View Inventory', module: 'Inventory' },
  { id: 'inventory.edit', label: 'Edit Inventory', module: 'Inventory' },
  { id: 'inventory.adjust', label: 'Adjust Inventory', module: 'Inventory' },
  { id: 'orders.view', label: 'View Orders', module: 'Orders' },
  { id: 'orders.process', label: 'Process Orders', module: 'Orders' },
  { id: 'orders.cancel', label: 'Cancel Orders', module: 'Orders' },
  { id: 'receiving.view', label: 'View Receiving', module: 'Receiving' },
  { id: 'receiving.process', label: 'Process Receipts', module: 'Receiving' },
  { id: 'shipping.view', label: 'View Shipping', module: 'Shipping' },
  { id: 'shipping.process', label: 'Process Shipments', module: 'Shipping' },
  { id: 'reports.view', label: 'View Reports', module: 'Reports' },
  { id: 'reports.export', label: 'Export Reports', module: 'Reports' },
  { id: 'admin.users', label: 'Manage Users', module: 'Admin' },
  { id: 'admin.settings', label: 'System Settings', module: 'Admin' },
]

const mockUsers: User[] = [
  { id: 'USR-001', username: 'jsmith', email: 'jsmith@company.com', firstName: 'John', lastName: 'Smith', role: 'Warehouse Manager', department: 'Operations', phone: '555-0101', status: 'active', lastLogin: '2024-01-15 14:32', createdAt: '2023-06-15', permissions: ['inventory.view', 'inventory.edit', 'orders.view', 'orders.process', 'receiving.view', 'receiving.process', 'shipping.view', 'shipping.process', 'reports.view'] },
  { id: 'USR-002', username: 'sjohnson', email: 'sjohnson@company.com', firstName: 'Sarah', lastName: 'Johnson', role: 'Receiving Lead', department: 'Receiving', phone: '555-0102', status: 'active', lastLogin: '2024-01-15 13:45', createdAt: '2023-08-22', permissions: ['inventory.view', 'receiving.view', 'receiving.process'] },
  { id: 'USR-003', username: 'mwilliams', email: 'mwilliams@company.com', firstName: 'Mike', lastName: 'Williams', role: 'Picker', department: 'Fulfillment', phone: '555-0103', status: 'active', lastLogin: '2024-01-15 12:20', createdAt: '2023-09-10', permissions: ['inventory.view', 'orders.view'] },
  { id: 'USR-004', username: 'edavis', email: 'edavis@company.com', firstName: 'Emily', lastName: 'Davis', role: 'Returns Specialist', department: 'Returns', phone: '555-0104', status: 'inactive', lastLogin: '2024-01-10 09:15', createdAt: '2023-07-05', permissions: ['inventory.view', 'inventory.adjust'] },
  { id: 'USR-005', username: 'admin', email: 'admin@company.com', firstName: 'Admin', lastName: 'User', role: 'Administrator', department: 'IT', phone: '555-0100', status: 'active', lastLogin: '2024-01-15 08:00', createdAt: '2023-01-01', permissions: ['inventory.view', 'inventory.edit', 'inventory.adjust', 'orders.view', 'orders.process', 'orders.cancel', 'receiving.view', 'receiving.process', 'shipping.view', 'shipping.process', 'reports.view', 'reports.export', 'admin.users', 'admin.settings'] },
  { id: 'USR-006', username: 'jbrown', email: 'jbrown@company.com', firstName: 'James', lastName: 'Brown', role: 'Shipping Lead', department: 'Shipping', phone: '555-0105', status: 'locked', lastLogin: '2024-01-14 16:30', createdAt: '2023-10-18', permissions: ['inventory.view', 'shipping.view', 'shipping.process'] },
]

const mockRoles: Role[] = [
  { id: 'ROLE-001', name: 'Administrator', description: 'Full system access', permissions: ['all'], userCount: 1 },
  { id: 'ROLE-002', name: 'Warehouse Manager', description: 'Manage warehouse operations', permissions: ['inventory.view', 'inventory.edit', 'orders.view', 'orders.process', 'receiving.view', 'receiving.process', 'shipping.view', 'shipping.process', 'reports.view'], userCount: 1 },
  { id: 'ROLE-003', name: 'Team Lead', description: 'Supervise team activities', permissions: ['inventory.view', 'receiving.view', 'receiving.process', 'shipping.view', 'shipping.process'], userCount: 2 },
  { id: 'ROLE-004', name: 'Operator', description: 'Basic operational tasks', permissions: ['inventory.view', 'orders.view'], userCount: 3 },
  { id: 'ROLE-005', name: 'Viewer', description: 'Read-only access', permissions: ['inventory.view', 'orders.view', 'reports.view'], userCount: 0 },
]

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Fetch users from API
  const { data: userData, isLoading, error, refetch } = useUserList({ search: searchTerm })

  // Map API users to UI format with fallback to mock data
  const apiUsers: User[] = userData?.data?.map((u: APIUser) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    department: u.department || 'Operations',
    phone: '',
    status: u.status === 'ACTIVE' ? 'active' : u.status === 'SUSPENDED' ? 'locked' : 'inactive',
    lastLogin: u.lastLogin || '',
    createdAt: u.createdAt,
    permissions: [],
  })) || []

  // Use API data if available, fallback to mock
  const users = apiUsers.length > 0 ? apiUsers : mockUsers

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: User['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      locked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      locked: Lock,
    }
    const Icon = icons[status]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs capitalize ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    lockedUsers: users.filter(u => u.status === 'locked').length,
    totalRoles: mockRoles.length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-blue-700 dark:text-blue-300">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700 dark:text-yellow-300">Unable to load from server. Showing demo data.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Locked Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.lockedUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Roles</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalRoles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'users', label: 'Users' },
            { id: 'roles', label: 'Roles' },
            { id: 'permissions', label: 'Permissions' },
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.department}</td>
                      <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.lastLogin}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            title={user.status === 'locked' ? 'Unlock' : 'Lock'}
                          >
                            {user.status === 'locked' ? (
                              <Unlock className="w-4 h-4 text-green-500" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 text-gray-500" />
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

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRoles.map((role) => (
            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Users className="w-4 h-4" />
                <span>{role.userCount} users</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <span key={perm} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                    {perm === 'all' ? 'Full Access' : perm.split('.')[0]}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
          <button className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:border-gray-400">
            <Plus className="w-5 h-5" />
            Add Role
          </button>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Matrix</h3>
          <div className="space-y-4">
            {['Inventory', 'Orders', 'Receiving', 'Shipping', 'Reports', 'Admin'].map((module) => (
              <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{module}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PERMISSIONS.filter(p => p.module === module).map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{perm.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.firstName}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.lastName}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  defaultValue={selectedUser.role}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {mockRoles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  defaultValue={selectedUser.department}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  defaultValue={selectedUser.status}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
