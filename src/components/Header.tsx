import { Bell, User, Moon, Sun, Menu, Brain, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWMSStore } from '../store/useWMSStore'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const navigate = useNavigate()
  const { alerts, darkMode, toggleDarkMode, toggleSidebar } = useWMSStore()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const unreadAlerts = alerts.filter(a => a.type === 'critical').length

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 dark:text-white">FlowLogic</span>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100">
              AI Intelligence Platform
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Predictive analytics and intelligent automation
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Dark mode toggle */}
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

          {/* Notifications */}
          <button
            onClick={() => navigate('/alerts')}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-1 sm:p-2 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'Operator'}
                </div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 sm:hidden">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.firstName || 'User'} {user?.lastName || ''}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'user@flowlogic.ai'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
