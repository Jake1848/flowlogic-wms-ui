import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'
import type { Metrics } from '../store/useWMSStore'

// Types
export interface DashboardAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  location?: string
  sku?: string
}

export interface SkippedLocation {
  location: string
  skipCount: number
}

export interface FrequentAdjustment {
  sku: string
  adjustmentCount: number
}

export interface DashboardData {
  metrics: Metrics
  alerts: DashboardAlert[]
  skippedLocations: SkippedLocation[]
  frequentAdjustments: FrequentAdjustment[]
}

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
  skippedLocations: () => [...dashboardKeys.all, 'skipped-locations'] as const,
  frequentAdjustments: () => [...dashboardKeys.all, 'frequent-adjustments'] as const,
}

// Mock data fallback for development
const mockMetrics: Metrics = {
  variancePercent: 1.8,
  auditCompletion: 87.5,
  errorRate: 0.3,
  cycleCountStatus: 'In Progress',
}

const mockAlerts: DashboardAlert[] = [
  {
    id: '1',
    type: 'critical',
    message: 'Negative quantity detected at location B-12-34',
    timestamp: new Date().toISOString(),
    location: 'B-12-34',
  },
  {
    id: '2',
    type: 'warning',
    message: 'Location A-05-12 skipped 3+ times',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: 'A-05-12',
  },
  {
    id: '3',
    type: 'warning',
    message: 'SKU ABC-123 has 3+ ABNs in last 7 days',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    sku: 'ABC-123',
  },
]

const mockSkippedLocations: SkippedLocation[] = [
  { location: 'A-12-34', skipCount: 5 },
  { location: 'B-05-21', skipCount: 4 },
  { location: 'C-18-09', skipCount: 3 },
  { location: 'D-03-45', skipCount: 2 },
  { location: 'A-22-11', skipCount: 1 },
]

const mockFrequentAdjustments: FrequentAdjustment[] = [
  { sku: 'SKU-1023', adjustmentCount: 8 },
  { sku: 'SKU-2045', adjustmentCount: 7 },
  { sku: 'SKU-3012', adjustmentCount: 6 },
  { sku: 'SKU-1234', adjustmentCount: 5 },
  { sku: 'SKU-5678', adjustmentCount: 4 },
]

// Check if API is available
async function fetchWithFallback<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(endpoint)
  } catch {
    // Return mock data if API is unavailable
    console.log(`Using mock data for ${endpoint}`)
    return fallback
  }
}

// Fetch dashboard metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => fetchWithFallback<Metrics>('/api/metrics', mockMetrics),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  })
}

// Fetch dashboard alerts
export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: () => fetchWithFallback<DashboardAlert[]>('/api/alerts', mockAlerts),
    refetchInterval: 15000,
  })
}

// Fetch skipped locations
export function useSkippedLocations() {
  return useQuery({
    queryKey: dashboardKeys.skippedLocations(),
    queryFn: () => fetchWithFallback<SkippedLocation[]>('/api/dashboard/skipped-locations', mockSkippedLocations),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Fetch frequent adjustments
export function useFrequentAdjustments() {
  return useQuery({
    queryKey: dashboardKeys.frequentAdjustments(),
    queryFn: () => fetchWithFallback<FrequentAdjustment[]>('/api/dashboard/frequent-adjustments', mockFrequentAdjustments),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Combined dashboard data hook
export function useDashboard() {
  const metrics = useDashboardMetrics()
  const alerts = useDashboardAlerts()
  const skippedLocations = useSkippedLocations()
  const frequentAdjustments = useFrequentAdjustments()

  return {
    metrics: metrics.data ?? mockMetrics,
    alerts: alerts.data ?? mockAlerts,
    skippedLocations: skippedLocations.data ?? mockSkippedLocations,
    frequentAdjustments: frequentAdjustments.data ?? mockFrequentAdjustments,
    isLoading: metrics.isLoading || alerts.isLoading,
    isError: metrics.isError || alerts.isError,
    refetch: () => {
      metrics.refetch()
      alerts.refetch()
      skippedLocations.refetch()
      frequentAdjustments.refetch()
    },
  }
}
