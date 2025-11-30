/**
 * Location-related types
 * - Location Maintenance (LMT)
 * - Location Status Maintenance (LSM)
 * - Location History Browser (LHB)
 * - Location Browser (LBR)
 * - Available Location Browser (ALB)
 */

// Location Maintenance (LMT) Types
export interface LocationMaintenance {
  id: string
  distributionCenter: string
  warehouse: string
  location: string
  witronLocation: string
  category: 'R' | 'S'
  categoryDesc: string
  description: string
  descriptionCode: string
  disposition: 'F' | 'D' | 'K'
  numberOfLanes: number
  positions: number
  selectionReserve: string
  height: number
  checkDigit: string
  voiceCheckDigit: string
  systemPositions: number
  manualPositions: number
  xCoord: number
  yCoord: number
  zCoord: number
  level: number
  stackDepth: number
  stackWidth: number
  stackLimit: number
  tempControlled: boolean
  controlDrugsAllowed: boolean
  backfillId: string
  backfillXCoord: number
  backfillYCoord: number
  backfillZCoord: number
  backfillChkDgt: string
  voiceCheckDigitBackfill: string
  replenSeq: string
  shipSeq: string
  letdownSeq: string
  letdownSeqDesc: string
  handling: string
  handlingDesc: string
  replenish: string
  replenishDesc: string
  locationUsagePercent: number
  trailerStatus: string
  trailerStatusDesc: string
  virtualLocation: boolean
  virtualLocationType: string
  maxWeightByPosition: number
  maxWeightForLocation: number
  maxWeightForColumn: number
  flStagePointId: string
  flStagePointXCoord: number
  flStagePointYCoord: number
  flStagePointZCoord: number
  flStagePointChkDgt: string
  comingleOK: boolean
  dimensionUsed: string
  dimensionUsedDesc: string
}

// Location Status Maintenance (LSM) Types
export type LocationStatusCode = 'A' | 'F' | 'H' | 'P'

export interface LocationStatus {
  id: string
  distributionCenter: string
  warehouse: string
  location: string
  status: LocationStatusCode
  backfill: string
  category: 'S' | 'R'
}

export interface LocationInventoryDetail {
  id: string
  licensePlate: string
  product: string
  detail: string
  qty: number
  status: 'A' | 'H'
  description: string
  rsnCode: string
  productDesc: string
  size: string
  codeDate: string
  statusDateTime: string
}

// Location History Browser (LHB) Types
export interface LocationHistory {
  id: string
  distributionCenter: string
  warehouse: string
  location: string
  category: string
  categoryDesc: string
  description: string
  level: number
  selPos: number
  rsvPos: number
  sizeWidth: number
  sizeDepth: number
  letdownsSince: string
  letdownCount: number
  average: number
  letdownsPerWeek: number
  weeksTracked: number
}

export interface LocationHistoryDetail {
  id: string
  date: string
  product: string
  detail: string
  associateName: string
  taskId: string
  status: string
  qty: number
  action: string
  type: string
  batchNo: number
  prodDesc: string
  customer: string
  fromLoc: string
  toLoc: string
  licensePlate: string
  batchSeq: number
}

// Location Browser (LBR) Types
export type LocationUsage = 'P' | 'A' | 'S' | 'F' | 'D' | 'T'

export interface LocationBrowse {
  id: string
  location: string
  description: string
  category: 'R' | 'S'
  usage: LocationUsage
  level: number
  stockWidth: number
  stockDepth: number
  selPos: number
  selHgt: number
  rsvPos: number
  rsvHgt: number
  commingle: boolean
  product: string
}

export interface LocationBrowseQuery {
  distributionCenter: string
  warehouse: string
  location: string
  description: string
  category: string
  usage: string
  level: string
}

// Available Location Browser (ALB) Types
export interface AvailableLocation {
  id: string
  location: string
  category: string
  usage: string
  level: number
  stackWidth: number
  stackDepth: number
  height: number
  commingle: boolean
  product: string
}

export interface AvailableLocationQuery {
  distributionCenter: string
  warehouse: string
  fromLocation: string
  toLocation: string
  category: string
  comingled: string
  locationLevel: string
  searchAnchor: string
  minLocationHeight: number
  maxLocationHeight: number
  stackWidth: string
  stackDepth: string
}
