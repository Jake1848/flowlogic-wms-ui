/**
 * Domain types barrel export
 * Split from the monolithic warehouse.ts for better maintainability
 */

// Common/shared types
export * from './common'

// Inventory types (SLM, IBV, PBD)
export * from './inventory'

// Location types (LMT, LSM, LHB, LBR, ALB)
export * from './locations'

// Order types (ORT, PO)
export * from './orders'

// Product types (ICF, WHC, PPS, PKS, FAM, DQT)
export * from './products'
