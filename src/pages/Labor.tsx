import { useState } from 'react'
import { Users, Clock, TrendingUp, Award, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Employee {
  id: string
  name: string
  role: 'picker' | 'packer' | 'receiver' | 'forklift' | 'supervisor'
  shift: 'morning' | 'afternoon' | 'night'
  status: 'active' | 'break' | 'offline'
  tasksCompleted: number
  unitsProcessed: number
  hoursWorked: number
  productivity: number
}

export default function Labor() {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'tasks'>('overview')

  // Mock employee data
  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Doe',
      role: 'picker',
      shift: 'morning',
      status: 'active',
      tasksCompleted: 45,
      unitsProcessed: 234,
      hoursWorked: 6.5,
      productivity: 98,
    },
    {
      id: '2',
      name: 'Sarah Miller',
      role: 'picker',
      shift: 'morning',
      status: 'active',
      tasksCompleted: 52,
      unitsProcessed: 289,
      hoursWorked: 6.5,
      productivity: 105,
    },
    {
      id: '3',
      name: 'Mike Roberts',
      role: 'packer',
      shift: 'morning',
      status: 'break',
      tasksCompleted: 38,
      unitsProcessed: 156,
      hoursWorked: 5.5,
      productivity: 92,
    },
    {
      id: '4',
      name: 'Lisa Kim',
      role: 'receiver',
      shift: 'morning',
      status: 'active',
      tasksCompleted: 28,
      unitsProcessed: 412,
      hoursWorked: 6.0,
      productivity: 95,
    },
    {
      id: '5',
      name: 'Tom Brown',
      role: 'forklift',
      shift: 'afternoon',
      status: 'offline',
      tasksCompleted: 0,
      unitsProcessed: 0,
      hoursWorked: 0,
      productivity: 0,
    },
  ]

  // Mock productivity data
  const productivityData = [
    { employee: 'Sarah M.', productivity: 105 },
    { employee: 'John D.', productivity: 98 },
    { employee: 'Lisa K.', productivity: 95 },
    { employee: 'Mike R.', productivity: 92 },
    { employee: 'Tom B.', productivity: 0 },
  ]

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'break':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getRoleColor = (role: Employee['role']) => {
    switch (role) {
      case 'picker':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'packer':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'receiver':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'forklift':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const activeEmployees = employees.filter(e => e.status === 'active').length
  const totalTasksToday = employees.reduce((sum, e) => sum + e.tasksCompleted, 0)
  const totalUnitsToday = employees.reduce((sum, e) => sum + e.unitsProcessed, 0)
  const avgProductivity = employees.filter(e => e.productivity > 0).reduce((sum, e) => sum + e.productivity, 0) / employees.filter(e => e.productivity > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Labor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track employee performance, tasks, and productivity
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Workers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {activeEmployees}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tasks Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalTasksToday}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Units Processed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalUnitsToday}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Productivity</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {avgProductivity.toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Team Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Performance Metrics
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Task Assignment
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Team Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Productivity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {employee.shift}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.tasksCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.unitsProcessed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.hoursWorked.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 w-20">
                            <div
                              className={`h-2 rounded-full ${
                                employee.productivity >= 100
                                  ? 'bg-green-500'
                                  : employee.productivity >= 90
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(employee.productivity, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {employee.productivity}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Employee Productivity Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="employee" />
                  <YAxis domain={[0, 120]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="productivity" fill="#3b82f6" name="Productivity %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Task Assignment Tab */}
          {activeTab === 'tasks' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Task Assignment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Assign and manage tasks for warehouse employees
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
