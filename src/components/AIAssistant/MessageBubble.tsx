import { Bot, CheckCircle, Loader2 } from 'lucide-react'
import type { Message, AnalysisStep } from './types'
import AnalysisResultCard from './AnalysisResultCard'
import SuggestedActionsCard from './SuggestedActionsCard'

interface MessageBubbleProps {
  message: Message
  onExecuteAction: (messageId: string, actionId: string) => void
  onQueueAction: (action: any, messageId: string) => void
  getSeverityColor: (severity: string) => string
  getImpactColor: (impact: string) => string
}

export default function MessageBubble({
  message,
  onExecuteAction,
  onQueueAction,
  getSeverityColor,
  getImpactColor,
}: MessageBubbleProps) {
  // User message
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-lg">
          {message.content}
        </div>
      </div>
    )
  }

  // System message
  if (message.role === 'system') {
    return (
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {message.content}
        </span>
      </div>
    )
  }

  // Typing indicator
  if (message.isTyping) {
    return <TypingIndicator steps={message.steps} />
  }

  // Assistant message
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm text-gray-200 text-sm">
            {message.content}
          </div>

          {/* Analysis Results */}
          {message.analysis && (
            <AnalysisResultCard
              analysis={message.analysis}
              getSeverityColor={getSeverityColor}
            />
          )}

          {/* Suggested Actions */}
          {message.actions && message.actions.length > 0 && (
            <SuggestedActionsCard
              actions={message.actions}
              messageId={message.id}
              onExecuteAction={onExecuteAction}
              onQueueAction={onQueueAction}
              getImpactColor={getImpactColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface TypingIndicatorProps {
  steps?: AnalysisStep[]
}

function TypingIndicator({ steps }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm inline-block">
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing system data...</span>
          </div>
        </div>
        {steps && steps.length > 0 && (
          <div className="space-y-1 pl-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-600" />
                )}
                <span
                  className={
                    step.status === 'completed'
                      ? 'text-gray-400'
                      : step.status === 'running'
                      ? 'text-violet-400'
                      : 'text-gray-600'
                  }
                >
                  {step.label}
                </span>
                {step.detail && <span className="text-gray-600">{step.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
