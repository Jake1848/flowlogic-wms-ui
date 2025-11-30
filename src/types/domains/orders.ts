/**
 * Order-related types
 * - Order Receipt Tracker (ORT)
 * - Purchase Orders
 */

// Order Receipt Tracker (ORT) Types
export type POSource = 'H' | 'W' // Host, Warehouse
export type TransportationType = 'T' | 'R' | 'B' | 'N' // Truck, Rail, Backhaul, None
export type POStatus = 'B' | 'C' | 'D' | 'E' | 'O' | 'P' | 'R' | 'V' // Backorder, Complete, Delete, Entered, Open, Put-away, Reopen, Verified

export interface PurchaseOrder {
  id: string
  poNumber: string
  warehouse: string
  source: POSource
  actDate: string
  transportation: TransportationType
  ordered: number
  received: number
  flowThru: number
  receiptNumber: string
  status: POStatus
  description: string
}
