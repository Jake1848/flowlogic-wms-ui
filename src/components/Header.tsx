import { Bell, User, Moon, Sun } from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'

export default function Header() {
  const { alerts, darkMode, toggleDarkMode } = useWMSStore()
  const unreadAlerts = alerts.filter(a => a.type === 'critical').length

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Warehouse Management System
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time inventory tracking and analytics
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin User
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Warehouse Manager
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
