import { Loader2, Clock, Users, Activity } from 'lucide-react'
import type { PatternResult } from '../../types/alerts'

interface PatternPanelProps {
  patternData: PatternResult | undefined
  isLoading: boolean
}

interface PatternCardProps {
  title: string
  icon: React.ReactNode
  color: string
  patterns: Array<{ pattern: string; description: string; confidence: number }> | undefined
}

function PatternCard({ title, icon, color, patterns }: PatternCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h4>
      </div>
      <div className="p-4 space-y-3">
        {patterns && patterns.length > 0 ? (
          patterns.map((pattern, i) => (
            <div key={i} className={`p-3 ${color} rounded-lg`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.pattern}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pattern.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      title.includes('Temporal') ? 'bg-blue-600' :
                      title.includes('Behavioral') ? 'bg-green-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${pattern.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{(pattern.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No {title.toLowerCase()} detected</p>
        )}
      </div>
    </div>
  )
}

export function PatternPanel({ patternData, isLoading }: PatternPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing patterns...</span>
      </div>
    )
  }

  if (!patternData?.success) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
        <Activity className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          {patternData?.error || 'Click "Run AI Analysis" to discover patterns in your data'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pattern Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Pattern Analysis Summary</h3>
        <p className="text-blue-100">
          {patternData.summary?.totalPatterns ?? 0} patterns identified,{' '}
          {patternData.summary?.significantPatterns ?? 0} significant
        </p>
        {patternData.summary?.recommendations && patternData.summary.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm font-medium mb-1">Top Recommendation:</p>
            <p className="text-sm text-blue-100">{patternData.summary.recommendations[0]}</p>
          </div>
        )}
      </div>

      {/* Pattern Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PatternCard
          title="Temporal Patterns"
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-900/20"
          patterns={patternData.patterns?.temporal}
        />
        <PatternCard
          title="Behavioral Patterns"
          icon={<Users className="w-4 h-4 text-green-600" />}
          color="bg-green-50 dark:bg-green-900/20"
          patterns={patternData.patterns?.behavioral}
        />
        <PatternCard
          title="Correlation Patterns"
          icon={<Activity className="w-4 h-4 text-purple-600" />}
          color="bg-purple-50 dark:bg-purple-900/20"
          patterns={patternData.patterns?.correlation}
        />
      </div>
    </div>
  )
}
