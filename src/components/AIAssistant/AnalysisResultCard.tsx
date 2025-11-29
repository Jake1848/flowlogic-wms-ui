import {
  FileSearch,
  History,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react'
import type { AnalysisResult } from './types'

interface AnalysisResultCardProps {
  analysis: AnalysisResult
  getSeverityColor: (severity: string) => string
}

export default function AnalysisResultCard({
  analysis,
  getSeverityColor,
}: AnalysisResultCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-violet-400" />
          <span className="font-medium text-white text-sm">{analysis.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full">
            {analysis.confidence}% confidence
          </span>
        </div>
      </div>

      {/* Data Points */}
      {analysis.dataPoints.length > 0 && (
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-gray-700 bg-gray-900/50">
          {analysis.dataPoints.map((dp, i) => {
            const Icon = dp.icon
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{dp.label}</p>
                  <div className="flex items-center gap-1">
                    <p
                      className={`text-sm font-semibold ${
                        dp.trend === 'up'
                          ? 'text-red-400'
                          : dp.trend === 'down'
                          ? 'text-amber-400'
                          : 'text-white'
                      }`}
                    >
                      {dp.value}
                    </p>
                    {dp.change && (
                      <span
                        className={`text-xs ${
                          dp.trend === 'up'
                            ? 'text-red-400'
                            : dp.trend === 'down'
                            ? 'text-amber-400'
                            : 'text-gray-500'
                        }`}
                      >
                        {dp.change}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline */}
      {analysis.timeline && analysis.timeline.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-700">
          <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
            <History className="w-3 h-3" /> Event Timeline
          </p>
          <div className="space-y-2">
            {analysis.timeline.slice(0, 4).map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 w-12 flex-shrink-0">{event.time}</span>
                <div
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    event.type === 'error'
                      ? 'bg-red-400'
                      : event.type === 'adjustment'
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-300">{event.event}</span>
                  {event.user && <span className="text-gray-500 ml-1">- {event.user}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings */}
      <div className="p-3 space-y-2">
        {analysis.findings.map((finding) => (
          <div
            key={finding.id}
            className={`px-3 py-2.5 rounded-lg border ${getSeverityColor(finding.severity)}`}
          >
            <div className="flex items-start gap-2">
              {finding.severity === 'critical' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : finding.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : finding.severity === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">{finding.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs opacity-70 flex-wrap">
                  <span>{finding.source}</span>
                  {finding.timestamp && (
                    <>
                      <span>•</span>
                      <span>{finding.timestamp}</span>
                    </>
                  )}
                </div>
                {finding.relatedData && (
                  <div className="mt-2 p-2 bg-black/20 rounded text-xs space-y-1">
                    {Object.entries(finding.relatedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
