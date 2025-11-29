import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Search,
  ChevronDown,
  ArrowRight,
  Circle,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'
import { pageIdToPath } from '../routes'
import {
  menuGroups,
  transactionCodes,
  getPageLabel,
  getPageGroup,
  type PageType,
} from '../config/navigation'

interface SidebarProps {
  currentPage: string
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar } = useWMSStore()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['dashboard']))
  const [commandInput, setCommandInput] = useState('')
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const commandInputRef = useRef<HTMLInputElement>(null)

  // Navigate to a page using React Router
  const navigateTo = (pageId: PageType) => {
    const path = pageIdToPath[pageId] || '/dashboard'
    navigate(path)
  }

  // Find which group contains the current page and expand it
  useEffect(() => {
    const group = menuGroups.find(g => g.items.some(item => item.id === currentPage))
    if (group && !expandedGroups.has(group.id)) {
      setExpandedGroups(prev => new Set([...prev, group.id]))
    }
  }, [currentPage])

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
        setTimeout(() => commandInputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setCommandInput('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const getFilteredSuggestions = () => {
    if (!commandInput) {
      return Object.entries(transactionCodes).slice(0, 8)
    }
    const input = commandInput.toUpperCase()
    const byCode = Object.entries(transactionCodes)
      .filter(([code]) => code.startsWith(input))

    const byName = Object.entries(transactionCodes)
      .filter(([code, page]) => {
        const label = getPageLabel(page).toLowerCase()
        return label.includes(commandInput.toLowerCase()) && !byCode.some(([c]) => c === code)
      })

    return [...byCode, ...byName].slice(0, 8)
  }

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const suggestions = getFilteredSuggestions()
    if (suggestions.length > 0) {
      const [, page] = suggestions[selectedSuggestionIndex] || suggestions[0]
      navigateTo(page)
      setCommandInput('')
      setShowCommandPalette(false)
      setSelectedSuggestionIndex(0)
    }
  }

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    const suggestions = getFilteredSuggestions()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    }
  }

  const handleSuggestionClick = (page: PageType) => {
    navigateTo(page)
    setCommandInput('')
    setShowCommandPalette(false)
    setSelectedSuggestionIndex(0)
  }

  return (
    <>
      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCommandPalette(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <form onSubmit={handleCommandSubmit}>
              <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => {
                    setCommandInput(e.target.value)
                    setSelectedSuggestionIndex(0)
                  }}
                  onKeyDown={handleKeyNavigation}
                  placeholder="Search transactions... (e.g. ALB, Inventory)"
                  className="w-full px-3 py-4 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  ESC
                </kbd>
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto p-2">
              {getFilteredSuggestions().length > 0 ? (
                <div className="space-y-1">
                  {getFilteredSuggestions().map(([code, page], index) => {
                    const group = getPageGroup(page)
                    return (
                      <button
                        key={code}
                        onClick={() => handleSuggestionClick(page)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${group?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                          {(() => {
                            const Icon = group?.items.find(i => i.id === page)?.icon || Circle
                            return <Icon className="w-4 h-4 text-white" />
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{getPageLabel(page)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{group?.label}</div>
                        </div>
                        <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {code}
                        </span>
                        {index === selectedSuggestionIndex && (
                          <ArrowRight className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No transactions found
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">K</kbd>
                  to open
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl transition-all duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <WarehouseIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">FlowLogic</h1>
                  <p className="text-xs text-gray-500">Warehouse Management</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors mx-auto text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Command Button (when expanded) */}
        {sidebarOpen && (
          <div className="px-3 py-3">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all group"
            >
              <Search className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
              <span className="flex-1 text-left text-sm text-gray-500 group-hover:text-gray-400">Quick navigation...</span>
              <kbd className="px-2 py-0.5 text-xs font-mono text-gray-600 bg-gray-800 rounded border border-gray-700">Ctrl+K</kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {menuGroups.map((group) => {
            const GroupIcon = group.icon
            const isExpanded = expandedGroups.has(group.id)
            const hasActiveItem = group.items.some(item => item.id === currentPage)
            const activeItem = group.items.find(item => item.id === currentPage)

            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => sidebarOpen ? toggleGroup(group.id) : navigateTo(group.items[0].id)}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                    sidebarOpen ? 'px-3 py-2.5' : 'p-3 justify-center'
                  } ${
                    hasActiveItem
                      ? 'bg-gray-800/80'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className={`${sidebarOpen ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg transition-transform duration-200 ${hasActiveItem ? 'scale-110' : ''}`}>
                    <GroupIcon className={`${sidebarOpen ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                  </div>
                  {sidebarOpen && (
                    <>
                      <div className="flex-1 text-left">
                        <span className={`font-medium text-sm ${hasActiveItem ? 'text-white' : 'text-gray-300'}`}>
                          {group.label}
                        </span>
                        {hasActiveItem && activeItem && (
                          <p className="text-xs text-gray-500 truncate">{activeItem.label}</p>
                        )}
                      </div>
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className={`w-4 h-4 ${hasActiveItem ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                    </>
                  )}
                </button>

                {/* Group Items */}
                {sidebarOpen && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mt-1 ml-4 pl-4 border-l border-gray-800 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateTo(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-white border-l-2 border-blue-400 -ml-[2px]'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-800 text-gray-600'
                            }`}>
                              {item.code}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-500">System Online</span>
              </div>
              <span className="text-xs text-gray-600">v1.0.0</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
