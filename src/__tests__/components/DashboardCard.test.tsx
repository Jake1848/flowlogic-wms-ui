import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Package } from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Total Orders',
    value: 1234,
    icon: Package,
  }

  it('renders title and value correctly', () => {
    render(<DashboardCard {...defaultProps} />)

    expect(screen.getByText('Total Orders')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('renders string value correctly', () => {
    render(<DashboardCard {...defaultProps} value="$50,000" />)

    expect(screen.getByText('$50,000')).toBeInTheDocument()
  })

  it('renders positive trend correctly', () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{ value: 12.5, isPositive: true }}
      />
    )

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    expect(screen.getByText('vs last week')).toBeInTheDocument()
  })

  it('renders negative trend correctly', () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{ value: 8.3, isPositive: false }}
      />
    )

    expect(screen.getByText('-8.3%')).toBeInTheDocument()
  })

  it('does not render trend when not provided', () => {
    render(<DashboardCard {...defaultProps} />)

    expect(screen.queryByText('vs last week')).not.toBeInTheDocument()
  })

  it('applies correct color classes', () => {
    const { container: blueContainer } = render(
      <DashboardCard {...defaultProps} color="blue" />
    )
    expect(blueContainer.querySelector('.bg-blue-50')).toBeInTheDocument()

    const { container: greenContainer } = render(
      <DashboardCard {...defaultProps} color="green" />
    )
    expect(greenContainer.querySelector('.bg-green-50')).toBeInTheDocument()

    const { container: redContainer } = render(
      <DashboardCard {...defaultProps} color="red" />
    )
    expect(redContainer.querySelector('.bg-red-50')).toBeInTheDocument()
  })

  it('defaults to blue color when not specified', () => {
    const { container } = render(<DashboardCard {...defaultProps} />)

    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument()
  })
})
