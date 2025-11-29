import { useRef, useEffect } from 'react'
import type { Message, SuggestedAction } from './types'
import MessageBubble from './MessageBubble'
import QuickPrompts from './QuickPrompts'
import ChatInput from './ChatInput'
import { getSeverityColor, getImpactColor } from './utils'

interface ChatTabProps {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  onSend: () => void
  isProcessing: boolean
  isListening: boolean
  setIsListening: (value: boolean) => void
  onExecuteAction: (messageId: string, actionId: string) => void
  onQueueAction: (action: SuggestedAction, messageId: string) => void
}

export default function ChatTab({
  messages,
  input,
  setInput,
  onSend,
  isProcessing,
  isListening,
  setIsListening,
  onExecuteAction,
  onQueueAction,
}: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Quick Prompts */}
      <QuickPrompts onSelectPrompt={handleQuickPrompt} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onExecuteAction={onExecuteAction}
            onQueueAction={onQueueAction}
            getSeverityColor={getSeverityColor}
            getImpactColor={getImpactColor}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={onSend}
        isProcessing={isProcessing}
        isListening={isListening}
        onToggleListening={() => setIsListening(!isListening)}
      />
    </>
  )
}
