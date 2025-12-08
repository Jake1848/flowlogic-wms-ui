import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '../../components/Header'
import { useWMSStore } from '../../store/useWMSStore'

// Reset store before each test
beforeEach(() => {
  useWMSStore.setState({
    alerts: [],
    darkMode: false,
  })
})

describe('Header Component', () => {
  it('renders the header with title', () => {
    render(<Header />)

    expect(screen.getByText('Warehouse Management System')).toBeInTheDocument()
    expect(screen.getByText('Real-time inventory tracking and analytics')).toBeInTheDocument()
  })

  it('renders user information', () => {
    render(<Header />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Warehouse Manager')).toBeInTheDocument()
  })

  it('toggles dark mode when button is clicked', () => {
    render(<Header />)

    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    expect(darkModeButton).toBeInTheDocument()

    // Initial state should show Moon icon (light mode)
    expect(useWMSStore.getState().darkMode).toBe(false)

    fireEvent.click(darkModeButton)

    // After click, dark mode should be enabled
    expect(useWMSStore.getState().darkMode).toBe(true)
  })

  it('shows alert count when there are critical alerts', () => {
    useWMSStore.setState({
      alerts: [
        { id: '1', type: 'critical', message: 'Test alert 1', timestamp: new Date().toISOString() },
        { id: '2', type: 'critical', message: 'Test alert 2', timestamp: new Date().toISOString() },
        { id: '3', type: 'warning', message: 'Warning alert', timestamp: new Date().toISOString() },
      ],
    })

    render(<Header />)

    // Should show 2 critical alerts count
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show alert count when there are no critical alerts', () => {
    useWMSStore.setState({
      alerts: [
        { id: '1', type: 'warning', message: 'Warning alert', timestamp: new Date().toISOString() },
        { id: '2', type: 'info', message: 'Info alert', timestamp: new Date().toISOString() },
      ],
    })

    render(<Header />)

    // Should not show any count badge
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })
})
