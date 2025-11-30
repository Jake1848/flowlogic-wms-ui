/**
 * Mock data generation utilities
 * These should be replaced with actual API calls in production
 */

/**
 * Seeded random number generator for consistent mock data
 */
export class SeededRandom {
  private seed: number

  constructor(seed: number | string) {
    this.seed = typeof seed === 'string'
      ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)]
  }
}

/**
 * Generate time series data for charts
 */
export interface TimeSeriesDataPoint {
  date: string
  value: number
}

export const generateTimeSeriesData = (
  days: number,
  baseValue: number,
  variance: number,
  seed?: string
): TimeSeriesDataPoint[] => {
  const rng = new SeededRandom(seed ?? Date.now().toString())
  const data: TimeSeriesDataPoint[] = []

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: baseValue + rng.nextInt(-variance, variance),
    })
  }

  return data
}

/**
 * Generate historical data with multiple metrics
 */
export interface MultiMetricDataPoint {
  time: string
  [key: string]: number | string
}

export const generateMultiMetricData = (
  pointCount: number,
  intervalMinutes: number,
  metrics: Record<string, { base: number; variance: number }>,
  seed?: string
): MultiMetricDataPoint[] => {
  const rng = new SeededRandom(seed ?? Date.now().toString())
  const data: MultiMetricDataPoint[] = []
  const now = new Date()

  for (let i = pointCount - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMinutes * 60 * 1000)
    const point: MultiMetricDataPoint = {
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    for (const [key, config] of Object.entries(metrics)) {
      point[key] = config.base + rng.nextFloat(-config.variance, config.variance)
    }

    data.push(point)
  }

  return data
}

/**
 * Common mock data patterns
 */
export const mockPatterns = {
  // Generate mock SKUs
  skus: (count: number, seed?: string): string[] => {
    const rng = new SeededRandom(seed ?? 'skus')
    const prefixes = ['SKU', 'ITEM', 'PROD', 'MAT']
    return Array.from({ length: count }, () =>
      `${rng.pick(prefixes)}-${rng.nextInt(10000, 99999)}`
    )
  },

  // Generate mock locations
  locations: (count: number, seed?: string): string[] => {
    const rng = new SeededRandom(seed ?? 'locations')
    const zones = ['A', 'B', 'C', 'D']
    return Array.from({ length: count }, () =>
      `${rng.pick(zones)}-${rng.nextInt(1, 99).toString().padStart(2, '0')}-${rng.nextInt(1, 5)}`
    )
  },

  // Generate mock order numbers
  orderNumbers: (count: number, prefix = 'ORD', seed?: string): string[] => {
    const rng = new SeededRandom(seed ?? 'orders')
    const year = new Date().getFullYear()
    return Array.from({ length: count }, () =>
      `${prefix}-${year}-${rng.nextInt(10000, 99999)}`
    )
  },

  // Generate mock carrier names
  carriers: (): string[] => [
    'UPS', 'FedEx', 'DHL', 'USPS', 'Amazon Logistics',
    'XPO Logistics', 'Old Dominion', 'Estes', 'ABF Freight', 'R+L Carriers',
  ],

  // Generate mock vendor names
  vendors: (): string[] => [
    'Acme Supplies', 'Global Parts Inc', 'Premier Materials',
    'Quality Products Co', 'Standard Manufacturing', 'Elite Components',
    'Pacific Trading', 'Atlantic Distributors', 'Metro Supply Chain',
  ],
}
