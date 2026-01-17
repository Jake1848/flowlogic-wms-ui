import { useState, useEffect } from 'react'
import {
  Brain, AlertTriangle, TrendingUp, DollarSign, Zap, RefreshCw, Sparkles,
  Package, MapPin, Layers, CheckCircle2, XCircle, ChevronRight, Info, Settings2
} from 'lucide-react'
import { AIStatCard } from '../components/ui/ai-stat-card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '../components/ui/glass-card'

interface Alert {
  id: string
  title: string
  message: string
  type: string
  severity: string
  isResolved: boolean
  createdAt: string
}

interface FWRDIssue {
  sku: string
  locationCode: string
  locationType: string
  severity: string
  description: string
  plateCount?: number
  totalQuantity?: number
  estimatedImpact?: number
}

interface ParameterMismatchIssue {
  sku: string
  description: string
  category: string
  severity: string
  parameters: {
    targetOrderMin: number
    shelfPack: number
    casePack?: number
    ratio: number
    isAligned: boolean
  }
  issue: {
    calculation: string
    roundedTo: string
    overagePerCycle: number
    roundingPercentage: number
  }
  financialImpact?: {
    overagePerCycle: number
    monthlyOverageUnits: number
    yearlyImpact: number
  }
  recommendations?: {
    primary: {
      action: string
      rationale: string
      risk: string
    }
  }
}

interface DashboardData {
  alerts: { unresolved: number }
  discrepancies: { total: number; critical: number; open: number }
  actions: { total: number; pending: number; completed: number }
  integrations: { total: number; active: number }
}

interface FWRDDetectionResult {
  summary: {
    totalLocationsAffected: number
    totalPlatesFragmented: number
    criticalLocations: number
    highRiskLocations: number
    estimatedYearlyImpact: number
  }
  count: number
  findings: FWRDIssue[]
  analysisNote?: string
}

interface ParameterMismatchResult {
  summary: {
    totalItemsAffected: number
    criticalItems: number
    highRiskItems: number
    totalYearlyOverageUnits: number
    estimatedYearlyImpact: number
  }
  count: number
  findings: ParameterMismatchIssue[]
  analysisNote?: string
}

export default function ModernIntelligenceDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [fwrdResults, setFwrdResults] = useState<FWRDDetectionResult | null>(null)
  const [paramMismatchResults, setParamMismatchResults] = useState<ParameterMismatchResult | null>(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthToken = () => localStorage.getItem('token')

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
    fetchAlerts()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    }
  }

  const fetchAlerts = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch('/api/alerts?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const response = await res.json()
        // API returns { data: [...], pagination: {...} }
        setAlerts(Array.isArray(response) ? response : response.data || response.alerts || [])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    }
  }

  const runFWRDDetection = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch('/api/intelligence/orders/fwrd/fragmentation?includeFinancialImpact=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFwrdResults(data)
        return data
      }
    } catch (err) {
      console.error('FWRD detection failed:', err)
    }
    return null
  }

  const runParameterMismatchDetection = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch('/api/intelligence/orders/parameter-mismatch?includeFinancialImpact=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setParamMismatchResults(data)
        return data
      }
    } catch (err) {
      console.error('Parameter mismatch detection failed:', err)
    }
    return null
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysisComplete(false)

    try {
      // Run both detections in parallel
      await Promise.all([
        runFWRDDetection(),
        runParameterMismatchDetection()
      ])

      // Refresh dashboard data
      await fetchDashboardData()
      await fetchAlerts()

      setAnalysisComplete(true)
    } catch (err) {
      setError('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'emergency':
        return 'bg-red-500'
      case 'high':
      case 'warning':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'emergency':
        return 'bg-red-500/20 text-red-400'
      case 'high':
      case 'warning':
        return 'bg-orange-500/20 text-orange-400'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-blue-500/20 text-blue-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-50 p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/20 via-accent-pink/20 to-accent-purple/20 rounded-3xl blur-3xl animate-pulse-slow" />

        <GlassCard variant="gradient" className="relative">
          <div className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            </div>

            {/* Analysis Status */}
            {analysisComplete && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400">
                  Analysis complete! Found {fwrdResults?.findings?.length || 0} FWRD fragmentation issues
                  and {paramMismatchResults?.findings?.length || 0} parameter mismatch issues.
                </span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AIStatCard
          title="Unresolved Alerts"
          value={dashboardData?.alerts?.unresolved ?? 0}
          icon={AlertTriangle}
          variant="warning"
          animated
        />
        <AIStatCard
          title="FWRD Issues"
          value={fwrdResults?.findings?.length ?? '—'}
          icon={Layers}
          variant="danger"
          animated
        />
        <AIStatCard
          title="Fragmented LPs"
          value={fwrdResults?.summary?.totalPlatesFragmented ?? '—'}
          icon={Package}
          variant="info"
          animated
        />
        <AIStatCard
          title="Param Mismatches"
          value={paramMismatchResults?.findings?.length ?? '—'}
          icon={Settings2}
          variant="warning"
          animated
        />
        <AIStatCard
          title="Yearly Overage"
          value={paramMismatchResults?.summary?.totalYearlyOverageUnits
            ? `${Math.round(paramMismatchResults.summary.totalYearlyOverageUnits).toLocaleString()}`
            : '—'}
          icon={TrendingUp}
          variant="info"
          animated
        />
        <AIStatCard
          title="Total $ Impact"
          value={(() => {
            const fwrdImpact = fwrdResults?.summary?.estimatedYearlyImpact || 0
            const paramImpact = paramMismatchResults?.summary?.estimatedYearlyImpact || 0
            const total = fwrdImpact + paramImpact
            return total > 0 ? `$${(total / 1000).toFixed(0)}K` : '—'
          })()}
          icon={DollarSign}
          variant="success"
          animated
        />
      </div>

      {/* FWRD Fragmentation Panel - Main Feature */}
      <GlassCard variant="gradient" className="border-2 border-accent-purple/30">
        <GlassCardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Layers className="w-5 h-5 text-red-400" />
            </div>
            <GlassCardTitle>FWRD License Plate Fragmentation</GlassCardTitle>
          </div>
          {fwrdResults && (
            <span className="text-sm text-white/60">
              {fwrdResults.findings.length} issues detected
            </span>
          )}
        </GlassCardHeader>
        <GlassCardContent>
          {!fwrdResults ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Layers className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 mb-4">Click "Run AI Analysis" to detect FWRD fragmentation issues</p>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                FWRD locations with multiple license plates for the same SKU prevent BOH reduction
                and cause inventory discrepancies.
              </p>
            </div>
          ) : fwrdResults.findings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-white/60">No FWRD fragmentation issues detected</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fwrdResults.findings.slice(0, 10).map((issue, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(issue.severity)} animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{issue.sku}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{issue.locationCode}</span>
                          <span className="text-white/30">•</span>
                          <span>{issue.locationType}</span>
                        </div>
                        <p className="text-sm text-white/60 line-clamp-2">{issue.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              ))}
              {fwrdResults.findings.length > 10 && (
                <div className="text-center py-2">
                  <span className="text-white/40 text-sm">
                    + {fwrdResults.findings.length - 10} more issues
                  </span>
                </div>
              )}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Parameter Mismatch Panel - Systematic Overage Detection */}
      <GlassCard variant="gradient" className="border-2 border-orange-500/30">
        <GlassCardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-orange-400" />
            </div>
            <GlassCardTitle>Parameter Mismatch Detection</GlassCardTitle>
          </div>
          {paramMismatchResults && (
            <span className="text-sm text-white/60">
              {paramMismatchResults.findings.length} items with systematic overage risk
            </span>
          )}
        </GlassCardHeader>
        <GlassCardContent>
          {!paramMismatchResults ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Settings2 className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 mb-4">Click "Run AI Analysis" to detect parameter mismatch issues</p>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                Detects items where Target Order Min is not divisible by Shelf Pack,
                causing systematic rounding overages during replenishment.
              </p>
            </div>
          ) : paramMismatchResults.findings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-white/60">No parameter mismatch issues detected</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paramMismatchResults.findings.slice(0, 10).map((issue, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(issue.severity)} animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{issue.sku}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{issue.description}</p>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span>Target Order Min: <span className="text-orange-400">{issue.parameters.targetOrderMin}</span></span>
                          <span>Shelf Pack: <span className="text-orange-400">{issue.parameters.shelfPack}</span></span>
                          <span>Overage/Cycle: <span className="text-red-400">+{issue.issue.overagePerCycle}</span></span>
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {issue.issue.calculation} → {issue.issue.roundedTo}
                        </p>
                        {issue.recommendations?.primary && (
                          <p className="text-xs text-emerald-400/80 mt-2">
                            Fix: {issue.recommendations.primary.action}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {issue.financialImpact && (
                        <span className="text-sm text-orange-400">
                          ${Math.round(issue.financialImpact.yearlyImpact).toLocaleString()}/yr
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {paramMismatchResults.findings.length > 10 && (
                <div className="text-center py-2">
                  <span className="text-white/40 text-sm">
                    + {paramMismatchResults.findings.length - 10} more items
                  </span>
                </div>
              )}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <GlassCard variant="gradient" hover>
          <GlassCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <GlassCardTitle>Active Alerts</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-6">
                <Info className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-white/50">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.filter(a => !a.isResolved).slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-purple/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)} ${
                          alert.severity === 'CRITICAL' ? 'animate-pulse' : ''
                        }`} />
                        <div>
                          <p className="text-white font-medium">{alert.title}</p>
                          <p className="text-white/50 text-sm line-clamp-1">{alert.message}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* AI Recommendations */}
        <GlassCard variant="gradient" hover>
          <GlassCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <GlassCardTitle>AI Recommendations</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {(fwrdResults && fwrdResults.findings.length > 0) || (paramMismatchResults && paramMismatchResults.findings.length > 0) ? (
                <>
                  {fwrdResults && fwrdResults.findings.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium flex-1">
                          Merge fragmented license plates in FWRD locations
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                          HIGH
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mb-3">
                        {fwrdResults.findings.length} FWRD locations have multiple LPs for the same SKU.
                        Merge to enable proper BOH reduction.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full w-[95%]" />
                        </div>
                        <span className="text-xs text-white/60">95% confidence</span>
                      </div>
                    </div>
                  )}
                  {paramMismatchResults && paramMismatchResults.findings.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium flex-1">
                          Align Target Order Min with Shelf Pack quantities
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                          HIGH
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mb-3">
                        {paramMismatchResults.findings.length} items have parameters causing systematic overages.
                        Simple parameter changes will eliminate rounding issues.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full w-[98%]" />
                        </div>
                        <span className="text-xs text-white/60">98% confidence</span>
                      </div>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium flex-1">
                        Review replenishment logic for parameter alignment
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                        MEDIUM
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mb-3">
                      Consider implementing validation rules to ensure new item setups have aligned parameters.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full w-[87%]" />
                      </div>
                      <span className="text-xs text-white/60">87% confidence</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-white/50">Run analysis to get AI recommendations</p>
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Info Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <Layers className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">About FWRD Fragmentation</p>
            <p className="text-blue-300/70 text-sm mt-1">
              FWRD (Forward) locations are reserve-type locations that don't automatically merge license plates.
              When the same SKU has multiple LPs in one FWRD location, BOH (Balance On Hand) reduction runs
              against each LP independently, causing inventory discrepancies.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
          <Settings2 className="w-5 h-5 text-orange-400 mt-0.5" />
          <div>
            <p className="text-orange-400 font-medium">About Parameter Mismatch</p>
            <p className="text-orange-300/70 text-sm mt-1">
              When Target Order Minimum is not divisible by Shelf Pack (e.g., 8 ÷ 3 = 2.67), the system rounds up
              to the next whole shelf pack, creating systematic overages each replenishment cycle. These small
              overages accumulate into significant inventory discrepancies over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
