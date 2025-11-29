import { forwardRef } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isProcessing: boolean
  isListening: boolean
  onToggleListening: () => void
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, isProcessing, isListening, onToggleListening }, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit()
    }

    return (
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleListening}
            className={`p-3 rounded-xl transition-colors ${
              isListening
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div className="flex-1 relative">
            <input
              ref={ref}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ask about inventory, orders, or warehouse operations..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              disabled={isProcessing}
            />
          </div>
          <button
            type="submit"
            disabled={!value.trim() || isProcessing}
            className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'

export default ChatInput
