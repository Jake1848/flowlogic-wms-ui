import {
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  BarChart3,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react'

type TabType = 'chat' | 'insights' | 'alerts'

interface AssistantHeaderProps {
  isMinimized: boolean
  isExpanded: boolean
  onToggleMinimize: () => void
  onToggleExpand: () => void
  onClose: () => void
  isConnected: boolean
}

export default function AssistantHeader({
  isMinimized,
  isExpanded,
  onToggleMinimize,
  onToggleExpand,
  onClose,
  isConnected,
}: AssistantHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Flow AI</h3>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Demo
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-gray-500">Intelligent Warehouse Assistant</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMinimize}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggleExpand}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4 rotate-45" />
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface TabBarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  unreadAlertCount: number
}

export function TabBar({ activeTab, setActiveTab, unreadAlertCount }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-800">
      <TabButton
        icon={<MessageSquare className="w-4 h-4" />}
        label="Chat"
        isActive={activeTab === 'chat'}
        onClick={() => setActiveTab('chat')}
      />
      <TabButton
        icon={<BarChart3 className="w-4 h-4" />}
        label="Insights"
        isActive={activeTab === 'insights'}
        onClick={() => setActiveTab('insights')}
      />
      <TabButton
        icon={<Bell className="w-4 h-4" />}
        label="Alerts"
        isActive={activeTab === 'alerts'}
        onClick={() => setActiveTab('alerts')}
        badge={unreadAlertCount}
      />
    </div>
  )
}

interface TabButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  badge?: number
}

function TabButton({ icon, label, isActive, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
        isActive
          ? 'text-violet-400 border-b-2 border-violet-400'
          : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
      {badge && badge > 0 && (
        <span className="absolute top-2 right-1/4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
