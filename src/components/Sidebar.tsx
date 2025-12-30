import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Search,
  ChevronDown,
  ArrowRight,
  Circle,
  Brain,
  Sparkles,
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['intelligence']))
  const [commandInput, setCommandInput] = useState('')
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const commandInputRef = useRef<HTMLInputElement>(null)

  // Navigate to a page using React Router
  const navigateTo = (pageId: PageType) => {
    const path = pageIdToPath[pageId] || '/'
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCommandPalette(false)}
          />
          <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden animate-fade-in">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            <form onSubmit={handleCommandSubmit}>
              <div className="flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
                <Search className="w-5 h-5 text-blue-500" />
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
                  className="w-full px-4 py-4 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  ESC
                </kbd>
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto p-3">
              {getFilteredSuggestions().length > 0 ? (
                <div className="space-y-1">
                  {getFilteredSuggestions().map(([code, page], index) => {
                    const group = getPageGroup(page)
                    return (
                      <button
                        key={code}
                        onClick={() => handleSuggestionClick(page)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          index === selectedSuggestionIndex
                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg`}>
                          {(() => {
                            const Icon = group?.items.find(i => i.id === page)?.icon || Circle
                            return <Icon className="w-5 h-5 text-white" />
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${index === selectedSuggestionIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {getPageLabel(page)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{group?.label}</div>
                        </div>
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
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
                <div className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">↑</kbd>
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">⌘</kbd>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">K</kbd>
                  to open
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl transition-all duration-300 z-40 flex flex-col
          ${sidebarOpen ? 'w-72 translate-x-0' : 'lg:w-20 w-72 -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-white/5">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">FlowLogic</h1>
                  <p className="text-xs text-slate-500">AI Intelligence Platform</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-colors mx-auto text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Command Button (when expanded) */}
        {sidebarOpen && (
          <div className="relative px-3 py-4">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              <span className="flex-1 text-left text-sm text-slate-500 group-hover:text-slate-300">Quick navigation...</span>
              <kbd className="px-2 py-1 text-xs font-mono text-slate-600 bg-slate-800/50 rounded-md border border-slate-700/50">⌘K</kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">
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
                      ? 'bg-white/5'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`relative ${sidebarOpen ? 'w-10 h-10' : 'w-11 h-11'} rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg transition-all duration-200 ${hasActiveItem ? 'shadow-lg scale-105' : 'shadow-md'}`}>
                    <GroupIcon className={`${sidebarOpen ? 'w-5 h-5' : 'w-5 h-5'} text-white`} />
                    {hasActiveItem && (
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    )}
                  </div>
                  {sidebarOpen && (
                    <>
                      <div className="flex-1 text-left">
                        <span className={`font-medium text-sm ${hasActiveItem ? 'text-white' : 'text-slate-300'}`}>
                          {group.label}
                        </span>
                        {hasActiveItem && activeItem && (
                          <p className="text-xs text-slate-500 truncate">{activeItem.label}</p>
                        )}
                      </div>
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className={`w-4 h-4 ${hasActiveItem ? 'text-slate-300' : 'text-slate-600'}`} />
                      </div>
                    </>
                  )}
                </button>

                {/* Group Items */}
                {sidebarOpen && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mt-1 ml-5 pl-4 border-l border-slate-800 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateTo(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent text-white border-l-2 border-blue-400 -ml-[2px] shadow-lg shadow-blue-500/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            <span className={`font-mono text-xs px-2 py-0.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-slate-800/50 text-slate-600 group-hover:bg-slate-800 group-hover:text-slate-400'
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
        <div className="relative border-t border-white/5 p-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-xs text-slate-500">System Online</span>
              </div>
              <span className="text-xs font-mono text-slate-600 px-2 py-1 bg-slate-800/50 rounded-md">v2.0.0</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
