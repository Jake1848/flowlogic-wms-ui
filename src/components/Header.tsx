import { Bell, User, Moon, Sun, Menu, Brain, LogOut, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWMSStore } from '../store/useWMSStore'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

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
    <header className="bg-dark-50/80 border-b border-white/10 sticky top-0 z-20 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left side - Menu button and branding */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-neon">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">
                FlowLogic AI
              </h1>
              <p className="text-xs text-white/50">
                Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/alerts')}
            className="relative text-white/70 hover:text-white hover:bg-white/10"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          <div className="relative ml-2" ref={userMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 h-10 text-white hover:bg-white/10"
            >
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-white">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </div>
                <div className="text-xs text-white/50">
                  {user?.role || 'Operator'}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-neon">
                <User className="w-5 h-5 text-white" />
              </div>
            </Button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-dark-100/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 py-1 z-50">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="text-sm font-medium text-white">
                    {user?.firstName || 'User'} {user?.lastName || ''}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {user?.email || 'user@flowlogic.ai'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
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
