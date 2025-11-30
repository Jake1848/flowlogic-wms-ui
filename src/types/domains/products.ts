/**
 * Product-related types
 * - Item Configuration (ICF)
 * - Warehouse Controls (WHC)
 * - Pick Performance Setup (PPS)
 * - Package Specifications (PKS)
 * - Facility Assignment (FAM)
 * - Dimension Query Tool (DQT)
 */

// Item Configuration (ICF) Types
export type ItemStatus = 'AC' | 'IN' | 'DC' | 'PD' // Active, Inactive, Discontinued, Pending

export interface ItemConfiguration {
  id: string
  distributionCenter: string
  product: string
  shortDescription: string
  longDescription: string
  status: ItemStatus
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
export type FacilityType = 'STANDARD' | 'CUSTOM'
export type FacilityUsage = 'SELECT' | 'RESERVE' | 'STAGING'

export interface FacilityAssignment {
  id: string
  distributionCenter: string
  cvsName: string
  product: string
  productDetail: string
  size: string
  warehouse: string
  description: string
  type: FacilityType
  usage: FacilityUsage
}

// Dimension Query Tool (DQT) Types
export interface DimensionQuery {
  distributionCenter: string
  warehouse: string
  variance: number
  fromDate: string
  toDate: string
}
