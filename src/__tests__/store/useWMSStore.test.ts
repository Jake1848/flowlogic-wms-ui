import { useWMSStore } from '../../store/useWMSStore'
import type { Alert, SKUData } from '../../store/useWMSStore'

// Reset store before each test
beforeEach(() => {
  useWMSStore.setState({
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
    filters: {
      searchTerm: '',
      abnOnly: false,
      epStatusFilter: 'all',
      dateRange: null,
    },
  })
})

describe('useWMSStore', () => {
  describe('UI State', () => {
    it('toggles sidebar state', () => {
      const { toggleSidebar } = useWMSStore.getState()

      expect(useWMSStore.getState().sidebarOpen).toBe(true)

      toggleSidebar()
      expect(useWMSStore.getState().sidebarOpen).toBe(false)

      toggleSidebar()
      expect(useWMSStore.getState().sidebarOpen).toBe(true)
    })

    it('toggles dark mode', () => {
      const { toggleDarkMode } = useWMSStore.getState()

      expect(useWMSStore.getState().darkMode).toBe(false)

      toggleDarkMode()
      expect(useWMSStore.getState().darkMode).toBe(true)

      toggleDarkMode()
      expect(useWMSStore.getState().darkMode).toBe(false)
    })
  })

  describe('Alert Management', () => {
    it('adds an alert', () => {
      const { addAlert } = useWMSStore.getState()

      const alert: Alert = {
        id: '1',
        type: 'critical',
        message: 'Test alert',
        timestamp: new Date().toISOString(),
      }

      addAlert(alert)

      expect(useWMSStore.getState().alerts).toHaveLength(1)
      expect(useWMSStore.getState().alerts[0]).toEqual(alert)
    })

    it('removes an alert by id', () => {
      const { addAlert, removeAlert } = useWMSStore.getState()

      addAlert({ id: '1', type: 'critical', message: 'Alert 1', timestamp: '' })
      addAlert({ id: '2', type: 'warning', message: 'Alert 2', timestamp: '' })

      expect(useWMSStore.getState().alerts).toHaveLength(2)

      removeAlert('1')

      expect(useWMSStore.getState().alerts).toHaveLength(1)
      expect(useWMSStore.getState().alerts[0].id).toBe('2')
    })

    it('clears all alerts', () => {
      const { addAlert, clearAlerts } = useWMSStore.getState()

      addAlert({ id: '1', type: 'critical', message: 'Alert 1', timestamp: '' })
      addAlert({ id: '2', type: 'warning', message: 'Alert 2', timestamp: '' })

      expect(useWMSStore.getState().alerts).toHaveLength(2)

      clearAlerts()

      expect(useWMSStore.getState().alerts).toHaveLength(0)
    })

    it('limits alerts to 50 items', () => {
      const { addAlert } = useWMSStore.getState()

      // Add 60 alerts
      for (let i = 0; i < 60; i++) {
        addAlert({
          id: String(i),
          type: 'info',
          message: `Alert ${i}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Should only keep 50 alerts
      expect(useWMSStore.getState().alerts).toHaveLength(50)
    })

    it('keeps most recent alerts when over limit', () => {
      const { addAlert } = useWMSStore.getState()

      for (let i = 0; i < 55; i++) {
        addAlert({
          id: String(i),
          type: 'info',
          message: `Alert ${i}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Most recent alert (id: 54) should be first
      expect(useWMSStore.getState().alerts[0].id).toBe('54')
    })
  })

  describe('SKU Selection', () => {
    it('sets and clears selected SKU', () => {
      const { setSelectedSKU } = useWMSStore.getState()

      const sku: SKUData = {
        id: '1',
        sku: 'SKU001',
        location: 'A-01-01',
        quantity: 100,
        abnCount: 0,
        epStatus: 'clear',
        lastAudit: '2024-01-01',
        variance: 0,
      }

      setSelectedSKU(sku)
      expect(useWMSStore.getState().selectedSKU).toEqual(sku)

      setSelectedSKU(null)
      expect(useWMSStore.getState().selectedSKU).toBeNull()
    })
  })

  describe('Metrics Management', () => {
    it('updates metrics partially', () => {
      const { updateMetrics } = useWMSStore.getState()

      updateMetrics({ variancePercent: 5.5 })

      expect(useWMSStore.getState().metrics.variancePercent).toBe(5.5)
      expect(useWMSStore.getState().metrics.auditCompletion).toBe(0)
    })

    it('updates multiple metrics at once', () => {
      const { updateMetrics } = useWMSStore.getState()

      updateMetrics({
        variancePercent: 2.5,
        auditCompletion: 85,
        errorRate: 1.2,
      })

      expect(useWMSStore.getState().metrics.variancePercent).toBe(2.5)
      expect(useWMSStore.getState().metrics.auditCompletion).toBe(85)
      expect(useWMSStore.getState().metrics.errorRate).toBe(1.2)
    })
  })

  describe('Filter Management', () => {
    it('sets filter partially', () => {
      const { setFilter } = useWMSStore.getState()

      setFilter({ searchTerm: 'test' })

      expect(useWMSStore.getState().filters.searchTerm).toBe('test')
      expect(useWMSStore.getState().filters.abnOnly).toBe(false)
    })

    it('sets multiple filters at once', () => {
      const { setFilter } = useWMSStore.getState()

      setFilter({
        searchTerm: 'SKU001',
        abnOnly: true,
        epStatusFilter: 'critical',
      })

      expect(useWMSStore.getState().filters.searchTerm).toBe('SKU001')
      expect(useWMSStore.getState().filters.abnOnly).toBe(true)
      expect(useWMSStore.getState().filters.epStatusFilter).toBe('critical')
    })

    it('resets filters to defaults', () => {
      const { setFilter, resetFilters } = useWMSStore.getState()

      setFilter({
        searchTerm: 'test',
        abnOnly: true,
        epStatusFilter: 'flagged',
      })

      resetFilters()

      expect(useWMSStore.getState().filters).toEqual({
        searchTerm: '',
        abnOnly: false,
        epStatusFilter: 'all',
        dateRange: null,
      })
    })
  })
})
