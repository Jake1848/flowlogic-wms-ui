import { LayoutDashboard, Package, FileText, Settings, Menu, X } from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: 'dashboard' | 'inventory' | 'reports' | 'settings') => void
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useWMSStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {sidebarOpen ? (
          <>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">FlowLogic</h1>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mx-auto"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center ${
                sidebarOpen ? 'px-6 py-3' : 'px-6 py-3 justify-center'
              } transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            FlowLogic WMS v1.0
          </div>
        </div>
      )}
    </aside>
  )
}
