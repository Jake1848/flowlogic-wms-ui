// Storage Location Manager (SLM) Types
export interface StorageLocation {
  id: string
  usage: 'P' | 'A' | 'S' | 'D' | 'F' // Primary, Alternate, Stocker, Deep Reserve, Forward Reserve
  category: 'R' | 'D' // Reserve, Direct
  detail: string
  location: string
  licPlate: string
  qty: number
  unitOfIssue: 'A' | 'B' | 'C' | 'E' | 'I' // Ad, Bulk, Case, Each, Inner pack
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

// Order Receipt Tracker (ORT) Types
export interface PurchaseOrder {
  id: string
  poNumber: string
  warehouse: string
  source: 'H' | 'W' // Host, Warehouse
  actDate: string
  transportation: 'T' | 'R' | 'B' | 'N' // Truck, Rail, Backhaul, None
  ordered: number
  received: number
  flowThru: number
  receiptNumber: string
  status: 'B' | 'C' | 'D' | 'E' | 'O' | 'P' | 'R' | 'V' // Backorder, Complete, Delete, Entered, Open, Put-away, Reopen, Verified
  description: string
}

// Item Configuration (ICF) Types
export interface ItemConfiguration {
  id: string
  distributionCenter: string
  product: string
  shortDescription: string
  longDescription: string
  status: 'AC' | 'IN' | 'DC' | 'PD' // Active, Inactive, Discontinued, Pending
  pendingDelete: boolean
  ucn: string
  crushFactor: number
  commodityType: string
  cycleClass: string
  buyer: string
  hazardousIndicator: boolean
  hazardousClass: string
  vendorProductNumber: string
  bioTerrorismTracking: boolean
  lotNumberControl: boolean
  countryOfOriginLabel: boolean
  rxItem: boolean
  rxControlledDrug: boolean
  deaSchedule: number
  specialControlSlotting: boolean
  stateControlledDrug: boolean
  caseCost: number
  captureTemperature: boolean
  familyGroup: string
  bagExclusion: boolean
  shipableQty: number
  reboxShippableQty: number
  // Reference items
  majorMinorClass: string
  privateLabelFlag: boolean
  cigaretteFlag: boolean
  unitCost: number
  easIndicator: boolean
  toleranceCode: string
  baseUnitOfMeasure: number
  hazardousWasteCode: boolean
  strength: string
  specialPackingFlag: boolean
  specialMarkingFlag: boolean
  specialLabelingFlag: boolean
  shippingPaperFlag: boolean
  tobaccoFlag: boolean
  displayItemFlag: boolean
  webStatus: boolean
  pendingDiscontinue: boolean
  storeReturnCode: string
  unCode: string
  storeItemDisposition: boolean
  webOnlyFlag: boolean
  priceLabel: boolean
  hazmatClassText: string
  packingGroup: string
  webOnDemand: boolean
  dscsaEligible: boolean
  weeExemption: boolean
  weeEndExpDate: string
}

// Warehouse Controls (WHC) Types
export interface WarehouseControls {
  id: string
  distributionCenter: string
  product: string
  status: string
  pendDel: boolean
  // Replenishment
  maxCherryPickCases: number
  dfltPriRplnAmt: number
  dfltPriRplnLvl: number
  dfltAltRplnAmt: number
  dfltAltRplnLvl: number
  dfltFwdRplnAmt: number
  dfltFwdRplnLvl: number
  autoShipProdDtls: boolean
  // Selection
  palletRoundPct: number
  caseLabelLimit: number
  bulkSelectLimit: number
  bulkSelectPercent: number
  forkSelectionRequired: boolean
  catchWeightControl: boolean
  defaultTransferLevel: number
  palletSelect: boolean
  reserveLocCapacityOvr: number
  conveyorUsageAllowed: boolean
  buyersReserveQuantity: number
  autoStoreAllow: boolean
  // Put-away
  putawayPalletLimit: number
  movementIndicator: number
  productDesignationCode: string
  // Code Date
  expirationDateCode: number
  readable: string
  codeDateProduct: boolean
  codeDateIncr: number
  minShelfLifeForReceiving: number
  codeDateVariance: number
  minShelfLifeForShipping: number
  productMaxDate: number
  // Flowthru
  flowThruType: string
  mandatoryFlowThruProduct: boolean
}

// Pick Performance Setup (PPS) Types
export interface PickPerformance {
  id: string
  distributionCenter: string
  product: string
  productDetail: string
  selLoc: string
  description: string
  catchWeight: number
  forkliftCasesHandled: number
  additionalHandlingTime: number
  retailPriceLabelApplyTime: number
  easMaterialApplyTime: number
  // Selection factors
  caseSelectConstant: number
  caseSelectAllow: number
  caseSelectConstantAdditional: number
  caseSelectAllowAdditional: number
  caseSelectDefaultOverride: number
  caseMultipleSelectConstant: number
  caseMultipleSelectAllow: number
  caseMultipleSelectConstantAdditional: number
  caseMultipleSelectAllowAdditional: number
  caseMultipleSelectDefaultOverride: number
  innerSelectConstant: number
  innerSelectAllow: number
  innerSelectConstantAdditional: number
  innerSelectAllowAdditional: number
  innerMultipleSelectConstant: number
  innerMultipleSelectAllow: number
  innerMultipleSelectConstantAdditional: number
  innerMultipleSelectAllowAdditional: number
  innerMultipleSelectDefaultOverride: number
  eachesSelectConstant: number
  eachesSelectAllow: number
  eachesSelectConstantAdditional: number
  eachesSelectAllowAdditional: number
  eachesMultipleSelectConstant: number
  eachesMultipleSelectAllow: number
  eachesMultipleSelectConstantAdditional: number
  eachesMultipleSelectAllowAdditional: number
  eachesMultipleSelectDefaultOverride: number
  caseReplenPutawayConstant: number
  caseReplenPutawayAllow: number
  caseReplenPutawayConstantAdditional: number
  caseReplenPutawayAllowAdditional: number
}

// Package Specifications (PKS) Types
export interface PackageSpecification {
  id: string
  distributionCenter: string
  product: string
  productDetail: string
  description: string
  size: string
  displayUnits: string
  packageSize: number
  user: string
  vendCaseRetailUnits: number
  pack: number
  shippingUnitsPerCase: number
  tareWeight: number
  vendor: string
  vendorName: string
  shippingPoint: number
  productType: string
  base: string
  shelfPack: number
  satelliteTransfers: number
  dailyMovement: number
  transferLevel: number
  transferMethod: string
  // Dimensions
  palletLength: number
  palletWidth: number
  palletHeight: number
  palletCube: number
  palletWeight: number
  caseUnits: number
  caseLength: number
  caseWidth: number
  caseHeight: number
  caseCube: number
  caseWeight: number
  innerUnits: number
  innerLength: number
  innerWidth: number
  innerHeight: number
  innerCube: number
  innerWeight: number
  unitLength: number
  unitWidth: number
  unitHeight: number
  unitCube: number
  unitWeight: number
  nestingLength: number
  nestingWidth: number
  nestingHeight: number
  nestingCube: number
  nestingWeight: number
  unitStackingHeight: number
  stockerPrepType: string
  // TI/HI
  storageTI: number
  storageHI: number
  vendorTI: number
  vendorHI: number
  smallPalletTI: number
  smallPalletHI: number
}

// Facility Assignment (FAM) Types
export interface FacilityAssignment {
  id: string
  distributionCenter: string
  cvsName: string
  product: string
  productDetail: string
  size: string
  warehouse: string
  description: string
  type: 'STANDARD' | 'CUSTOM'
  usage: 'SELECT' | 'RESERVE' | 'STAGING'
}

// Dimension Query Tool (DQT) Types
export interface DimensionQuery {
  distributionCenter: string
  warehouse: string
  variance: number
  fromDate: string
  toDate: string
}

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

// Location Status Maintenance (LSM) Types
export interface LocationStatus {
  id: string
  distributionCenter: string
  warehouse: string
  location: string
  status: 'A' | 'F' | 'H' | 'P'
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
export interface LocationBrowse {
  id: string
  location: string
  description: string
  category: 'R' | 'S'
  usage: 'P' | 'A' | 'S' | 'F' | 'D' | 'T'
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

// Common types
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
