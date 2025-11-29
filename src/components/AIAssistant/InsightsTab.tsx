import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lightbulb,
  ChevronRight,
  Clock,
  Shield,
  History,
  Boxes,
  Layers,
  Users,
} from 'lucide-react'
import type { InsightCard, Prediction, ConversationSummary, WMSSystemData } from './types'
import Sparkline from './Sparkline'
import { getImpactColor, formatTimeAgo } from './utils'

interface InsightsTabProps {
  insightCards: InsightCard[]
  predictions: Prediction[]
  conversationHistory: ConversationSummary[]
  wmsSystemData: WMSSystemData
}

export default function InsightsTab({
  insightCards,
  predictions,
  conversationHistory,
  wmsSystemData,
}: InsightsTabProps) {
  const [showPredictions, setShowPredictions] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Insight Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {insightCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.sparkline && (
                  <Sparkline
                    data={card.sparkline}
                    color={
                      card.trend === 'up'
                        ? '#10b981'
                        : card.trend === 'down'
                        ? '#ef4444'
                        : '#6b7280'
                    }
                  />
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.title}</p>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {card.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : card.trend === 'down' ? (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                ) : (
                  <Minus className="w-3 h-3 text-gray-400" />
                )}
                <span
                  className={`text-xs ${
                    card.trend === 'up'
                      ? 'text-emerald-400'
                      : card.trend === 'down'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {card.change > 0 ? '+' : ''}
                  {card.change}% {card.changeLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Predictions Section */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-sm">AI Predictions</span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
              {predictions.length} active
            </span>
          </div>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${showPredictions ? 'rotate-90' : ''}`}
          />
        </button>

        {showPredictions && (
          <div className="p-3 border-t border-gray-700 space-y-2">
            {predictions.map((pred) => (
              <div key={pred.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{pred.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getImpactColor(pred.impact)}`}>
                        {pred.impact}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pred.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pred.timeframe}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-lg font-bold text-white">{pred.probability}%</div>
                    <div className="text-xs text-gray-500">probability</div>
                  </div>
                </div>
                {pred.preventiveAction && (
                  <div className="mt-3 p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                    <p className="text-xs text-violet-400 flex items-start gap-1">
                      <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {pred.preventiveAction}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Conversations */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white text-sm">Recent Conversations</span>
        </div>
        <div className="divide-y divide-gray-700">
          {conversationHistory.map((conv) => (
            <button
              key={conv.id}
              className="w-full p-3 text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.preview}</p>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTimeAgo(conv.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">{conv.messageCount} messages</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
          <Boxes className="w-5 h-5 text-blue-400 mx-auto" />
          <p className="text-lg font-bold text-white mt-1">
            {wmsSystemData.inventory.totalItems.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Total Items</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
          <Layers className="w-5 h-5 text-emerald-400 mx-auto" />
          <p className="text-lg font-bold text-white mt-1">
            {wmsSystemData.locations.totalLocations.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Locations</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
          <Users className="w-5 h-5 text-violet-400 mx-auto" />
          <p className="text-lg font-bold text-white mt-1">
            {wmsSystemData.labor.activeUsers}/{wmsSystemData.labor.totalUsers}
          </p>
          <p className="text-xs text-gray-500">Active Users</p>
        </div>
      </div>
    </div>
  )
}
