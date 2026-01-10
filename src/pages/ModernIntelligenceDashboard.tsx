import { useState } from 'react'
import { Brain, AlertTriangle, TrendingUp, DollarSign, Zap, RefreshCw, Sparkles } from 'lucide-react'
import { AIStatCard } from '../components/ui/ai-stat-card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '../components/ui/glass-card'

export default function ModernIntelligenceDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-50 p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/20 via-accent-pink/20 to-accent-purple/20 rounded-3xl blur-3xl animate-pulse-slow" />

        <GlassCard variant="gradient" className="relative">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Animated AI Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl blur-xl opacity-75 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl shadow-neon">
                    <Brain className="w-10 h-10 text-white animate-float" />
                  </div>
                </div>

                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    AI Intelligence Hub
                  </h1>
                  <p className="text-white/60 mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-purple" />
                    Real-time inventory intelligence powered by advanced AI
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="group relative px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl font-semibold text-white shadow-neon hover:shadow-[0_0_30px_rgba(139,92,246,0.8)] transition-all duration-300 disabled:opacity-50 overflow-hidden"
                >
                  <div className="relative flex items-center gap-2 z-10">
                    {isAnalyzing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
                  </div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AIStatCard
          title="Open Issues"
          value={42}
          icon={AlertTriangle}
          variant="warning"
          trend={{
            value: 12,
            label: 'vs last week',
            direction: 'down'
          }}
          animated
        />
        <AIStatCard
          title="Critical Alerts"
          value={3}
          icon={AlertTriangle}
          variant="danger"
          animated
        />
        <AIStatCard
          title="Accuracy Score"
          value="98.5%"
          icon={TrendingUp}
          variant="success"
          trend={{
            value: 2.3,
            label: 'vs last month',
            direction: 'up'
          }}
          animated
        />
        <AIStatCard
          title="Cost Impact"
          value="$12.4K"
          icon={DollarSign}
          variant="info"
          trend={{
            value: 8,
            label: 'savings',
            direction: 'up'
          }}
          animated
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Discrepancies */}
        <GlassCard variant="gradient" hover>
          <GlassCardHeader>
            <GlassCardTitle>Recent Discrepancies</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {[
                { severity: 'critical', type: 'Negative On-Hand', sku: 'SKU-001', impact: '$125' },
                { severity: 'high', type: 'Cycle Count Variance', sku: 'SKU-005', impact: '$675' },
                { severity: 'medium', type: 'Unexplained Shortage', sku: 'SKU-012', impact: '$340' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-purple/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                        item.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{item.type}</p>
                        <p className="text-white/50 text-sm">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{item.impact}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        item.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* AI Recommendations */}
        <GlassCard variant="gradient" hover>
          <GlassCardHeader>
            <GlassCardTitle>AI Recommendations</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {[
                { priority: 'high', action: 'Initiate cycle count for SKU-001', confidence: 95 },
                { priority: 'medium', action: 'Review receiving process for vendor V-123', confidence: 87 },
                { priority: 'low', action: 'Optimize pick path for zone A', confidence: 72 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-purple/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-medium flex-1">{item.action}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full transition-all duration-500"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60">{item.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
