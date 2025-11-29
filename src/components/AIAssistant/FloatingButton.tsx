import { Bot } from 'lucide-react'

interface FloatingButtonProps {
  onClick: () => void
  unreadCount: number
}

export default function FloatingButton({ onClick, unreadCount }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50 group"
    >
      <Bot className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          {unreadCount}
        </span>
      )}
      <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Ask Flow AI
        <span className="text-gray-500 ml-2 text-xs">Ctrl+/</span>
      </span>
    </button>
  )
}
