import { create } from 'zustand'

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  sku?: string
  location?: string
}

export interface SKUData {
  id: string
  sku: string
  location: string
  quantity: number
  abnCount: number
  epStatus: 'clear' | 'flagged' | 'critical'
  lastAudit: string
  variance: number
}

export interface Metrics {
  variancePercent: number
  auditCompletion: number
  errorRate: number
  cycleCountStatus: string
}

export interface Filter {
  searchTerm: string
  abnOnly: boolean
  epStatusFilter: 'all' | 'clear' | 'flagged' | 'critical'
  dateRange: { start: string; end: string } | null
}

interface WMSStore {
  // UI State
  sidebarOpen: boolean
  darkMode: boolean

  // Data State
  selectedSKU: SKUData | null
  alerts: Alert[]
  metrics: Metrics
  filters: Filter

  // Actions
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setSelectedSKU: (sku: SKUData | null) => void
  addAlert: (alert: Alert) => void
  removeAlert: (id: string) => void
  clearAlerts: () => void
  updateMetrics: (metrics: Partial<Metrics>) => void
  setFilter: (filter: Partial<Filter>) => void
  resetFilters: () => void
}

const defaultFilters: Filter = {
  searchTerm: '',
  abnOnly: false,
  epStatusFilter: 'all',
  dateRange: null,
}

export const useWMSStore = create<WMSStore>((set) => ({
  // Initial State
  sidebarOpen: true,
  darkMode: false,
  selectedSKU: null,
  alerts: [],
  metrics: {
    variancePercent: 0,
    auditCompletion: 0,
    errorRate: 0,
    cycleCountStatus: 'In Progress',
  },
  filters: defaultFilters,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.darkMode
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { darkMode: newDarkMode }
  }),

  setSelectedSKU: (sku) => set({ selectedSKU: sku }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50) // Keep only last 50 alerts
  })),

  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== id)
  })),

  clearAlerts: () => set({ alerts: [] }),

  updateMetrics: (metrics) => set((state) => ({
    metrics: { ...state.metrics, ...metrics }
  })),

  setFilter: (filter) => set((state) => ({
    filters: { ...state.filters, ...filter }
  })),

  resetFilters: () => set({ filters: defaultFilters }),
}))
