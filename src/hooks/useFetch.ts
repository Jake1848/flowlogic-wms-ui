import { useState, useEffect, useCallback } from 'react'

interface UseFetchOptions {
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { autoRefresh = false, refreshInterval = 15000 } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll use mock data since backend doesn't exist
      // In production, this would be: const response = await fetch(url)
      const mockData = await getMockData<T>(url)

      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const intervalId = setInterval(fetchData, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Mock data generator for development
async function getMockData<T>(url: string): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  if (url.includes('/api/metrics')) {
    return {
      variancePercent: 1.8,
      auditCompletion: 87.5,
      errorRate: 0.3,
      cycleCountStatus: 'In Progress',
    } as T
  }

  if (url.includes('/api/alerts')) {
    return [
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
    ] as T
  }

  if (url.includes('/api/inventory') || url.includes('/api/abns')) {
    // Generate mock inventory data
    const mockInventory = []
    for (let i = 0; i < 50; i++) {
      mockInventory.push({
        id: `sku-${i}`,
        sku: `SKU-${1000 + i}`,
        location: `${String.fromCharCode(65 + Math.floor(i / 10))}-${String(Math.floor(i % 10)).padStart(2, '0')}-${String(Math.floor(Math.random() * 50)).padStart(2, '0')}`,
        quantity: Math.floor(Math.random() * 1000) - 50,
        abnCount: Math.floor(Math.random() * 5),
        epStatus: ['clear', 'flagged', 'critical'][Math.floor(Math.random() * 3)] as 'clear' | 'flagged' | 'critical',
        lastAudit: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        variance: (Math.random() * 10 - 5).toFixed(2),
      })
    }
    return mockInventory as T
  }

  return {} as T
}
