/**
 * Warehouse types - Re-exports from domain-specific files
 *
 * This file maintains backwards compatibility by re-exporting all types
 * from the new domain-specific files in src/types/domains/
 *
 * For new code, prefer importing directly from:
 * - '@/types/domains/common' - Common/shared types
 * - '@/types/domains/inventory' - Inventory types (SLM, IBV, PBD)
 * - '@/types/domains/locations' - Location types (LMT, LSM, LHB, LBR, ALB)
 * - '@/types/domains/orders' - Order types (ORT, PO)
 * - '@/types/domains/products' - Product types (ICF, WHC, PPS, PKS, FAM, DQT)
 */

export * from './domains'
