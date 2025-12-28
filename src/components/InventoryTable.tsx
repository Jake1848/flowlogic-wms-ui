import { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { SKUData } from '../store/useWMSStore'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface InventoryTableProps {
  data: SKUData[]
  onRowClick: (sku: SKUData) => void
}

type SortField = 'sku' | 'location' | 'quantity' | 'abnCount' | 'variance'
type SortDirection = 'asc' | 'desc'

export default function InventoryTable({ data, onRowClick }: InventoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('sku')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        return prevField
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  const filteredData = useMemo(() =>
    data.filter(
      (item) =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [data, searchTerm]
  )

  const sortedData = useMemo(() =>
    [...filteredData].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1
      if (sortField === 'sku' || sortField === 'location') {
        return multiplier * a[sortField].localeCompare(b[sortField])
      }
      return multiplier * (a[sortField] - b[sortField])
    }),
    [filteredData, sortField, sortDirection]
  )

  const totalPages = useMemo(() => Math.ceil(sortedData.length / itemsPerPage), [sortedData.length])

  const paginatedData = useMemo(() =>
    sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [sortedData, currentPage]
  )

  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }, [sortField, sortDirection])

  const getEPStatusBadge = useCallback((status: SKUData['epStatus']) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'flagged':
        return <Badge variant="warning">Flagged</Badge>
      default:
        return <Badge variant="success">Normal</Badge>
    }
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by SKU or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('sku')}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors"
                >
                  SKU
                  <SortIcon field="sku" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors"
                >
                  Location
                  <SortIcon field="location" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('quantity')}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors"
                >
                  Quantity
                  <SortIcon field="quantity" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('abnCount')}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors"
                >
                  ABN Count
                  <SortIcon field="abnCount" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('variance')}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors"
                >
                  Variance
                  <SortIcon field="variance" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow
                key={`${item.sku}-${item.location}`}
                onClick={() => onRowClick(item)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{item.sku}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>{item.quantity.toLocaleString()}</TableCell>
                <TableCell>{item.abnCount}</TableCell>
                <TableCell>
                  <span className={item.variance > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}>
                    {item.variance > 0 ? '+' : ''}{item.variance}
                  </span>
                </TableCell>
                <TableCell>{getEPStatusBadge(item.epStatus)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
