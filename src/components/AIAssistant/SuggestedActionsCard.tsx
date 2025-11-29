import {
  Workflow,
  Play,
  Search,
  Eye,
  Clock,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import type { SuggestedAction } from './types'

interface SuggestedActionsCardProps {
  actions: SuggestedAction[]
  messageId: string
  onExecuteAction: (messageId: string, actionId: string) => void
  onQueueAction: (action: SuggestedAction, messageId: string) => void
  getImpactColor: (impact: string) => string
}

export default function SuggestedActionsCard({
  actions,
  messageId,
  onExecuteAction,
  onQueueAction,
  getImpactColor,
}: SuggestedActionsCardProps) {
  const executeAllAutoFixes = () => {
    actions
      .filter((a) => a.status === 'pending' && a.type === 'auto_fix')
      .forEach((a) => onExecuteAction(messageId, a.id))
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-white text-sm">Suggested Actions</span>
        </div>
        <button
          onClick={executeAllAutoFixes}
          className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          Execute All
        </button>
      </div>

      {/* Actions List */}
      <div className="p-3 space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className="px-3 py-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{action.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getImpactColor(action.impact)}`}>
                    {action.impact}
                  </span>
                  {action.eta && <span className="text-xs text-gray-500">{action.eta}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{action.description}</p>
                {action.details && action.status === 'pending' && (
                  <div className="mt-2 space-y-1">
                    {action.details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1 h-1 rounded-full bg-gray-600" />
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <ActionButton
                  action={action}
                  messageId={messageId}
                  onExecuteAction={onExecuteAction}
                  onQueueAction={onQueueAction}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  action: SuggestedAction
  messageId: string
  onExecuteAction: (messageId: string, actionId: string) => void
  onQueueAction: (action: SuggestedAction, messageId: string) => void
}

function ActionButton({ action, messageId, onExecuteAction, onQueueAction }: ActionButtonProps) {
  if (action.status === 'pending' && (action.type === 'auto_fix' || action.type === 'prevent')) {
    return (
      <button
        onClick={() => onExecuteAction(messageId, action.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
      >
        <Play className="w-3 h-3" />
        Execute
      </button>
    )
  }

  if (action.status === 'pending' && action.type === 'investigate') {
    return (
      <button
        onClick={() => onExecuteAction(messageId, action.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
      >
        <Search className="w-3 h-3" />
        Investigate
      </button>
    )
  }

  if (action.status === 'pending' && action.type === 'manual') {
    return (
      <div className="flex gap-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors">
          <Eye className="w-3 h-3" />
          Review
        </button>
        <button
          onClick={() => onQueueAction(action, messageId)}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium rounded-lg transition-colors"
          title="Add to queue"
        >
          <Clock className="w-3 h-3" />
        </button>
      </div>
    )
  }

  if (action.status === 'running') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 text-amber-400 text-xs rounded-lg">
        <Loader2 className="w-3 h-3 animate-spin" />
        Running...
      </div>
    )
  }

  if (action.status === 'completed') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 text-xs rounded-lg">
        <CheckCircle className="w-3 h-3" />
        Done
      </div>
    )
  }

  return null
}
