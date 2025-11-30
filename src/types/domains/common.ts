/**
 * Common/shared types used across multiple domains
 */

export interface Product {
  id: string
  productCode: string
  description: string
  detail: string
  size: string
}

export interface Warehouse {
  id: string
  code: string
  name: string
  distributionCenter: string
}

export interface DistributionCenter {
  id: string
  code: string
  name: string
}

// Common status types
export type ActiveStatus = 'AC' | 'IN' | 'DC' | 'PD' // Active, Inactive, Discontinued, Pending
export type LocationCategory = 'R' | 'S' // Reserve, Selection
export type LocationDisposition = 'F' | 'D' | 'K'
export type InventoryItemStatus = 'A' | 'H' // Active, Held (for inventory records)
