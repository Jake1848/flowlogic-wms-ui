/**
 * Inventory-related types
 * - Storage Location Manager (SLM)
 * - Inventory Balance Viewer (IBV)
 * - Product BOH Detail (PBD)
 */

// Storage Location Manager (SLM) Types
export type StorageUsage = 'P' | 'A' | 'S' | 'D' | 'F' // Primary, Alternate, Stocker, Deep Reserve, Forward Reserve
export type StorageCategory = 'R' | 'D' // Reserve, Direct
export type UnitOfIssue = 'A' | 'B' | 'C' | 'E' | 'I' // Ad, Bulk, Case, Each, Inner pack

export interface StorageLocation {
  id: string
  usage: StorageUsage
  category: StorageCategory
  detail: string
  location: string
  licPlate: string
  qty: number
  unitOfIssue: UnitOfIssue
  receiptId: string
  status: string
  codeDate: string
  lotNo: string
}

export interface StorageLocationHeader {
  center: string
  warehouse: string
  product: string
  detail: string
  desc: string
  size: string
  boh: number
  hold: number
  primary: number
  alternate: number
  stocker: number
  forward: number
  deep: number
  buyerRsv: number
  xferIO: number
}

// Inventory Balance Viewer (IBV) Types
export interface InventoryBalance {
  warehouse: string
  type: string // ST (Standard)
  detail: string
  pack: number
  cases: number
  size: string
  ti: number
  hi: number
  boh: number
  inTransit: number
  outbound: number
}

// Product BOH Detail (PBD) Types
export interface ProductBOHDetail {
  id: string
  distributionCenter: string
  warehouse: string
  product: string
  upc: string
  detail: string
  description: string
  size: string
  selLoc: string
  codeDate: string
  storageCase: number
  ti: number
  hi: number
  lot: string
  locationBOH: number
  picksLetdowns: number
  ptwysRplnsRtrns: number
  xferQty: number
  realtimeBOH: number
  inprocessPicks: number
  pendingPicks: number
  pendingLetdown: number
  pendingPutaways: number
  pendingReplenishments: number
  pendingReturns: number
  selectActive: number
  selectHeld: number
  selectPending: number
  selectCommitted: number
  reserveActive: number
  reserveHeld: number
  reservePending: number
  reserveCommitted: number
}
