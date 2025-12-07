import { useState, useEffect, useCallback } from 'react'

interface UseFetchOptions {
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
  useMockData?: boolean // Force mock data for development
}

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// API base URL - use environment variable or default to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { autoRefresh = false, refreshInterval = 15000, useMockData = false } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // If mock data is explicitly requested, use it
      if (useMockData) {
        const mockData = await getMockData<T>(url)
        setData(mockData)
        return
      }

      // Make real API call
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        // If API fails, fall back to mock data in development
        if (import.meta.env.DEV) {
          console.warn(`API call failed for ${url}, using mock data`)
          const mockData = await getMockData<T>(url)
          setData(mockData)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      // Handle both direct data and { data: ... } wrapper formats
      setData(result.data !== undefined ? result.data : result)
    } catch (err) {
      // In development, fall back to mock data on error
      if (import.meta.env.DEV) {
        console.warn(`Error fetching ${url}, using mock data:`, err)
        try {
          const mockData = await getMockData<T>(url)
          setData(mockData)
          return
        } catch {
          // If mock data also fails, set error
        }
      }
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      setLoading(false)
    }
  }, [url, useMockData])

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const intervalId = setInterval(fetchData, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Mock data generator for development fallback
async function getMockData<T>(url: string): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  if (url.includes('/api/metrics') || url.includes('/api/dashboard')) {
    return {
      variancePercent: 1.8,
      auditCompletion: 87.5,
      errorRate: 0.3,
      cycleCountStatus: 'In Progress',
      totalOrders: 1247,
      pendingShipments: 89,
      activeWorkers: 42,
      utilizationRate: 78.5,
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

  if (url.includes('/api/orders')) {
    const mockOrders = []
    for (let i = 0; i < 25; i++) {
      mockOrders.push({
        id: `order-${i}`,
        orderNumber: `ORD-${10000 + i}`,
        status: ['pending', 'picking', 'packing', 'shipped', 'delivered'][Math.floor(Math.random() * 5)],
        customerName: `Customer ${i + 1}`,
        itemCount: Math.floor(Math.random() * 20) + 1,
        totalValue: (Math.random() * 5000 + 100).toFixed(2),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
      })
    }
    return mockOrders as T
  }

  if (url.includes('/api/receiving')) {
    const mockReceiving = []
    for (let i = 0; i < 15; i++) {
      mockReceiving.push({
        id: `rcv-${i}`,
        poNumber: `PO-${20000 + i}`,
        vendor: `Vendor ${i + 1}`,
        status: ['scheduled', 'in_progress', 'completed', 'issue'][Math.floor(Math.random() * 4)],
        expectedDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        itemCount: Math.floor(Math.random() * 100) + 10,
        dockDoor: `Door ${Math.floor(Math.random() * 10) + 1}`,
      })
    }
    return mockReceiving as T
  }

  if (url.includes('/api/shipping')) {
    const mockShipping = []
    for (let i = 0; i < 20; i++) {
      mockShipping.push({
        id: `ship-${i}`,
        shipmentNumber: `SHP-${30000 + i}`,
        carrier: ['FedEx', 'UPS', 'USPS', 'DHL'][Math.floor(Math.random() * 4)],
        status: ['pending', 'loading', 'in_transit', 'delivered'][Math.floor(Math.random() * 4)],
        orderCount: Math.floor(Math.random() * 50) + 1,
        destination: `City ${i + 1}, State`,
        scheduledDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    return mockShipping as T
  }

  if (url.includes('/api/labor') || url.includes('/api/workers')) {
    const mockWorkers = []
    for (let i = 0; i < 30; i++) {
      mockWorkers.push({
        id: `worker-${i}`,
        name: `Worker ${i + 1}`,
        department: ['Receiving', 'Picking', 'Packing', 'Shipping'][Math.floor(Math.random() * 4)],
        status: ['active', 'break', 'offline'][Math.floor(Math.random() * 3)],
        tasksCompleted: Math.floor(Math.random() * 100),
        efficiency: (Math.random() * 40 + 60).toFixed(1),
        clockedIn: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(),
      })
    }
    return mockWorkers as T
  }

  return {} as T
}
