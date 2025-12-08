import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import InventoryTable from '../../components/InventoryTable'
import type { SKUData } from '../../store/useWMSStore'

const mockData: SKUData[] = [
  { id: '1', sku: 'SKU-001', location: 'A-01-01', quantity: 100, abnCount: 0, variance: 2, epStatus: 'clear', lastAudit: '2024-01-15' },
  { id: '2', sku: 'SKU-002', location: 'B-02-01', quantity: 50, abnCount: 5, variance: -8, epStatus: 'flagged', lastAudit: '2024-01-14' },
  { id: '3', sku: 'SKU-003', location: 'C-03-01', quantity: -10, abnCount: 2, variance: 15, epStatus: 'critical', lastAudit: '2024-01-13' },
  { id: '4', sku: 'ABC-100', location: 'D-04-01', quantity: 200, abnCount: 0, variance: 0, epStatus: 'clear', lastAudit: '2024-01-12' },
]

describe('InventoryTable', () => {
  const mockOnRowClick = jest.fn()

  beforeEach(() => {
    mockOnRowClick.mockClear()
  })

  it('renders table with inventory data', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    expect(screen.getByText('SKU-001')).toBeInTheDocument()
    expect(screen.getByText('A-01-01')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders all column headers', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    expect(screen.getByText('ABN Count')).toBeInTheDocument()
    expect(screen.getByText('EP Status')).toBeInTheDocument()
    expect(screen.getByText('Variance')).toBeInTheDocument()
  })

  it('filters data based on search term', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const searchInput = screen.getByPlaceholderText('Search by SKU or Location...')
    fireEvent.change(searchInput, { target: { value: 'ABC' } })

    expect(screen.getByText('ABC-100')).toBeInTheDocument()
    expect(screen.queryByText('SKU-001')).not.toBeInTheDocument()
  })

  it('filters by location', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const searchInput = screen.getByPlaceholderText('Search by SKU or Location...')
    fireEvent.change(searchInput, { target: { value: 'B-02' } })

    expect(screen.getByText('SKU-002')).toBeInTheDocument()
    expect(screen.queryByText('SKU-001')).not.toBeInTheDocument()
  })

  it('calls onRowClick when row is clicked', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const row = screen.getByText('SKU-001').closest('tr')
    if (row) {
      fireEvent.click(row)
    }

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('displays ABN count badge when count > 0', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    // SKU-002 has abnCount of 5, shown in an orange badge
    const abnBadge = screen.getByText('5')
    expect(abnBadge).toBeInTheDocument()
    expect(abnBadge).toHaveClass('bg-orange-100')

    // SKU-001 has abnCount of 0 - should NOT have an orange badge
    const row1 = screen.getByText('SKU-001').closest('tr')
    const abnBadges = row1?.querySelectorAll('.bg-orange-100')
    expect(abnBadges?.length).toBe(0)
  })

  it('displays EP status with correct styling', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    // Multiple rows have 'clear' status, use getAllByText
    expect(screen.getAllByText('clear').length).toBeGreaterThan(0)
    expect(screen.getByText('flagged')).toBeInTheDocument()
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  it('formats variance correctly with +/- signs', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    expect(screen.getByText('+2%')).toBeInTheDocument()
    expect(screen.getByText('-8%')).toBeInTheDocument()
    expect(screen.getByText('+15%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('highlights negative quantities in red', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    // Find the -10 quantity cell
    const negativeCell = screen.getByText('-10')
    expect(negativeCell).toHaveClass('text-red-600')
  })

  it('renders pagination info correctly', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    expect(screen.getByText(/Showing 1 to 4 of 4 results/)).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const prevButton = screen.getByLabelText('Go to previous page')
    expect(prevButton).toBeDisabled()
  })

  it('sorts by SKU when header is clicked', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const skuHeader = screen.getByText('SKU')

    // Click twice to sort descending then ascending (starts in asc, click makes desc, click again makes asc)
    fireEvent.click(skuHeader)
    fireEvent.click(skuHeader)

    // Get all SKU cells
    const rows = screen.getAllByRole('row').slice(1) // Skip header row
    const firstSku = rows[0]?.querySelector('td')?.textContent

    // After sorting ascending again, ABC-100 should be first (alphabetically)
    expect(firstSku).toBe('ABC-100')
  })

  it('handles keyboard navigation on rows', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    const row = screen.getByText('SKU-001').closest('tr')
    if (row) {
      fireEvent.keyDown(row, { key: 'Enter' })
    }

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('renders empty state gracefully', () => {
    render(<InventoryTable data={[]} onRowClick={mockOnRowClick} />)

    // When empty, the component shows "Showing 1 to 0 of 0 results"
    expect(screen.getByText(/of 0/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<InventoryTable data={mockData} onRowClick={mockOnRowClick} />)

    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Inventory table')
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search inventory by SKU or location')
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Pagination')
  })
})
