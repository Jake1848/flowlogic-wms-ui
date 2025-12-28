import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { AnomalyResult, PatternResult } from '../types/alerts'

export function useAnomalyDetection(anomalyType: string, enabled: boolean) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<AnomalyResult>({
    queryKey: ['ai-anomalies', anomalyType],
    queryFn: async (): Promise<AnomalyResult> => {
      const response = await api.post<AnomalyResult>('/ai/anomaly-detection', {
        type: anomalyType,
        lookbackDays: 30
      })
      return response.data
    },
    enabled
  })

  const runDetection = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/anomaly-detection', {
        type: anomalyType,
        lookbackDays: 30
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-anomalies'] })
    }
  })

  return {
    anomalyData: data,
    anomalyLoading: isLoading,
    runAnomalyDetection: runDetection
  }
}

export function usePatternAnalysis(enabled: boolean) {
  const { data, isLoading, refetch } = useQuery<PatternResult>({
    queryKey: ['ai-patterns'],
    queryFn: async (): Promise<PatternResult> => {
      const response = await api.post<PatternResult>('/ai/pattern-analysis', {
        lookbackDays: 60
      })
      return response.data
    },
    enabled
  })

  return {
    patternData: data,
    patternLoading: isLoading,
    refetchPatterns: refetch
  }
}
