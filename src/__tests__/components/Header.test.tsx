import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/__mocks__/AuthContext'
import Header from '../../components/Header'
import { useWMSStore } from '../../store/useWMSStore'

// Note: AuthContext is automatically redirected to the mock via jest.config.js moduleNameMapper
// This avoids the import.meta.env issue in the real AuthContext

beforeEach(() => {
  useWMSStore.setState({ alerts: [], darkMode: false })
})

const renderHeader = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
      </AuthProvider>
    </MemoryRouter>
  )

describe('Header Component', () => {
  it('renders the FlowLogic branding', () => {
    renderHeader()
    expect(screen.getByText('FlowLogic AI')).toBeInTheDocument()
    expect(screen.getByText('Intelligence Platform')).toBeInTheDocument()
  })

  it('renders user information', () => {
    renderHeader()
    expect(screen.getAllByText(/Admin User/i).length).toBeGreaterThan(0)
  })

  it('shows alert count when there are critical alerts', () => {
    useWMSStore.setState({
      alerts: [
        { id: '1', type: 'critical', message: 'Test alert 1', timestamp: new Date().toISOString() },
        { id: '2', type: 'critical', message: 'Test alert 2', timestamp: new Date().toISOString() },
        { id: '3', type: 'warning', message: 'Warning alert', timestamp: new Date().toISOString() },
      ],
    })
    renderHeader()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show alert count when there are no critical alerts', () => {
    useWMSStore.setState({
      alerts: [{ id: '1', type: 'warning', message: 'Warning alert', timestamp: new Date().toISOString() }],
    })
    renderHeader()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    renderHeader()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })
})
