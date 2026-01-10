import { NavLink } from 'react-router-dom'
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Database,
  Settings,
  Sparkles,
  Zap,
  Activity,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  badge?: string | number
}

const navigation: NavItem[] = [
  { name: 'Intelligence Hub', path: '/', icon: Brain },
  { name: 'AI Alerts', path: '/alerts', icon: AlertTriangle, badge: 3 },
  { name: 'Demand Forecasting', path: '/forecast', icon: TrendingUp },
  { name: 'Cost Analytics', path: '/costanalytics', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Integrations', path: '/integrations', icon: Database },
  { name: 'System Health', path: '/systemhealth', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
]

interface ModernSidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export default function ModernSidebar({ isOpen, onClose }: ModernSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 transition-transform duration-300 ease-in-out lg:translate-x-0",
          // Glassmorphic background
          "bg-gradient-to-b from-dark-50/95 via-dark-100/95 to-dark-50/95 backdrop-blur-2xl",
          "border-r border-white/10",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="relative px-6 py-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl blur-lg opacity-75 animate-pulse-slow" />
                <div className="relative p-2.5 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl shadow-neon">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                {/* AI indicator */}
                <div className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-dark-50 animate-pulse">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  FlowLogic
                </h1>
                <p className="text-xs text-accent-purple font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  AI Intelligence
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-accent-purple/20 to-accent-pink/20 text-white shadow-neon"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-accent-purple to-accent-pink rounded-r-full" />
                  )}

                  {/* Icon with glow effect on active */}
                  <div className={cn(
                    "transition-transform duration-200 group-hover:scale-110",
                    isActive && "drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  <span className="flex-1">{item.name}</span>

                  {/* Badge */}
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System Status Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-400">AI Systems Online</p>
                <p className="text-xs text-white/50">All services operational</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
