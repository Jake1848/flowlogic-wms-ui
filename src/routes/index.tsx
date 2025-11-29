import { lazy, Suspense, type FC, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
)

// Lazy load Login page separately (public route)
const Login = lazy(() => import('../pages/Login'))

// Lazy load all page components for better performance
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Inventory = lazy(() => import('../pages/Inventory'))
const Reports = lazy(() => import('../pages/Reports'))
const Settings = lazy(() => import('../pages/Settings'))
const Receiving = lazy(() => import('../pages/Receiving'))
const Picking = lazy(() => import('../pages/Picking'))
const Orders = lazy(() => import('../pages/Orders'))
const Labor = lazy(() => import('../pages/Labor'))
const Returns = lazy(() => import('../pages/Returns'))
const Integrations = lazy(() => import('../pages/Integrations'))
const Warehouse = lazy(() => import('../pages/Warehouse'))
const QualityControl = lazy(() => import('../pages/QualityControl'))
const Replenishment = lazy(() => import('../pages/Replenishment'))
const MobileScanner = lazy(() => import('../pages/MobileScanner'))
const AbandonCodes = lazy(() => import('../pages/AbandonCodes'))
const LocationAssignments = lazy(() => import('../pages/LocationAssignments'))
const MarkoutProcess = lazy(() => import('../pages/MarkoutProcess'))
const CasePackManagement = lazy(() => import('../pages/CasePackManagement'))
const CycleCounting = lazy(() => import('../pages/CycleCounting'))
const Shipping = lazy(() => import('../pages/Shipping'))
const DockScheduling = lazy(() => import('../pages/DockScheduling'))
const YardManagement = lazy(() => import('../pages/YardManagement'))
const TaskManagement = lazy(() => import('../pages/TaskManagement'))
const LotTracking = lazy(() => import('../pages/LotTracking'))
const WavePlanning = lazy(() => import('../pages/WavePlanning'))
const Alerts = lazy(() => import('../pages/Alerts'))
const Slotting = lazy(() => import('../pages/Slotting'))
const Cartonization = lazy(() => import('../pages/Cartonization'))
const LoadPlanning = lazy(() => import('../pages/LoadPlanning'))
const AuditTrail = lazy(() => import('../pages/AuditTrail'))
const UserManagement = lazy(() => import('../pages/UserManagement'))
const KitBuilding = lazy(() => import('../pages/KitBuilding'))
const CrossDocking = lazy(() => import('../pages/CrossDocking'))
const ASNManagement = lazy(() => import('../pages/ASNManagement'))
const VendorManagement = lazy(() => import('../pages/VendorManagement'))
const PurchaseOrders = lazy(() => import('../pages/PurchaseOrders'))
const Billing = lazy(() => import('../pages/Billing'))
const CustomerManagement = lazy(() => import('../pages/CustomerManagement'))
const ItemMaster = lazy(() => import('../pages/ItemMaster'))
const InventoryAdjustments = lazy(() => import('../pages/InventoryAdjustments'))
const EquipmentManagement = lazy(() => import('../pages/EquipmentManagement'))
const Compliance = lazy(() => import('../pages/Compliance'))
const ZoneManagement = lazy(() => import('../pages/ZoneManagement'))
const CarrierManagement = lazy(() => import('../pages/CarrierManagement'))
const WorkOrders = lazy(() => import('../pages/WorkOrders'))
const PromotionsManagement = lazy(() => import('../pages/PromotionsManagement'))
const EDIManagement = lazy(() => import('../pages/EDIManagement'))
const AppointmentScheduling = lazy(() => import('../pages/AppointmentScheduling'))
const PalletManagement = lazy(() => import('../pages/PalletManagement'))
const ParcelShipping = lazy(() => import('../pages/ParcelShipping'))
const DocumentManagement = lazy(() => import('../pages/DocumentManagement'))
const RMAProcessing = lazy(() => import('../pages/RMAProcessing'))
const DemandForecasting = lazy(() => import('../pages/DemandForecasting'))
const SerialTracking = lazy(() => import('../pages/SerialTracking'))
const FreightAudit = lazy(() => import('../pages/FreightAudit'))
const SLAManagement = lazy(() => import('../pages/SLAManagement'))
const SafetyManagement = lazy(() => import('../pages/SafetyManagement'))
const WorkforceScheduling = lazy(() => import('../pages/WorkforceScheduling'))
const CapacityPlanning = lazy(() => import('../pages/CapacityPlanning'))
const InboundPlanning = lazy(() => import('../pages/InboundPlanning'))
const OutboundPlanning = lazy(() => import('../pages/OutboundPlanning'))
const ClientPortal = lazy(() => import('../pages/ClientPortal'))
const CostAnalytics = lazy(() => import('../pages/CostAnalytics'))
const ProductivityMetrics = lazy(() => import('../pages/ProductivityMetrics'))
const NotificationCenter = lazy(() => import('../pages/NotificationCenter'))
const SystemHealth = lazy(() => import('../pages/SystemHealth'))
const HazmatManagement = lazy(() => import('../pages/HazmatManagement'))
const VASOperations = lazy(() => import('../pages/VASOperations'))
const StorageLocationManager = lazy(() => import('../pages/StorageLocationManager'))
const InventoryBalanceViewer = lazy(() => import('../pages/InventoryBalanceViewer'))
const OrderReceiptTracker = lazy(() => import('../pages/OrderReceiptTracker'))
const ItemConfiguration = lazy(() => import('../pages/ItemConfiguration'))
const WarehouseControls = lazy(() => import('../pages/WarehouseControls'))
const PickPerformanceSetup = lazy(() => import('../pages/PickPerformanceSetup'))
const PackageSpecifications = lazy(() => import('../pages/PackageSpecifications'))
const FacilityAssignmentPage = lazy(() => import('../pages/FacilityAssignment'))
const DimensionQueryTool = lazy(() => import('../pages/DimensionQueryTool'))
const LocationMaintenance = lazy(() => import('../pages/LocationMaintenance'))
const ProductBOHDetail = lazy(() => import('../pages/ProductBOHDetail'))
const LocationStatusMaintenance = lazy(() => import('../pages/LocationStatusMaintenance'))
const LocationHistoryBrowser = lazy(() => import('../pages/LocationHistoryBrowser'))
const LocationBrowser = lazy(() => import('../pages/LocationBrowser'))
const AvailableLocationBrowser = lazy(() => import('../pages/AvailableLocationBrowser'))
const BatchSlotAdjust = lazy(() => import('../pages/BatchSlotAdjust'))
const SupplierReturns = lazy(() => import('../pages/SupplierReturns'))
const AdjustmentHistoryBrowser = lazy(() => import('../pages/AdjustmentHistoryBrowser'))
const MovementAuditLog = lazy(() => import('../pages/MovementAuditLog'))

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<FC>): ReactNode => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

// Public routes (no authentication required)
export const publicRoutes: RouteObject[] = [
  { path: '/login', element: withSuspense(Login) },
]

// Protected routes (authentication required)
export const protectedRoutes: RouteObject[] = [
  { path: '/', element: withSuspense(Dashboard) },
  { path: '/dashboard', element: withSuspense(Dashboard) },
  { path: '/receiving', element: withSuspense(Receiving) },
  { path: '/picking', element: withSuspense(Picking) },
  { path: '/orders', element: withSuspense(Orders) },
  { path: '/inventory', element: withSuspense(Inventory) },
  { path: '/returns', element: withSuspense(Returns) },
  { path: '/labor', element: withSuspense(Labor) },
  { path: '/warehouse', element: withSuspense(Warehouse) },
  { path: '/quality', element: withSuspense(QualityControl) },
  { path: '/replenishment', element: withSuspense(Replenishment) },
  { path: '/mobile', element: withSuspense(MobileScanner) },
  { path: '/abandon', element: withSuspense(AbandonCodes) },
  { path: '/locations', element: withSuspense(LocationAssignments) },
  { path: '/markout', element: withSuspense(MarkoutProcess) },
  { path: '/casepack', element: withSuspense(CasePackManagement) },
  { path: '/cycle', element: withSuspense(CycleCounting) },
  { path: '/shipping', element: withSuspense(Shipping) },
  { path: '/dock', element: withSuspense(DockScheduling) },
  { path: '/yard', element: withSuspense(YardManagement) },
  { path: '/tasks', element: withSuspense(TaskManagement) },
  { path: '/lots', element: withSuspense(LotTracking) },
  { path: '/waves', element: withSuspense(WavePlanning) },
  { path: '/alerts', element: withSuspense(Alerts) },
  { path: '/slotting', element: withSuspense(Slotting) },
  { path: '/cartonization', element: withSuspense(Cartonization) },
  { path: '/loadplan', element: withSuspense(LoadPlanning) },
  { path: '/audit', element: withSuspense(AuditTrail) },
  { path: '/users', element: withSuspense(UserManagement) },
  { path: '/kitting', element: withSuspense(KitBuilding) },
  { path: '/crossdock', element: withSuspense(CrossDocking) },
  { path: '/asn', element: withSuspense(ASNManagement) },
  { path: '/vendors', element: withSuspense(VendorManagement) },
  { path: '/pos', element: withSuspense(PurchaseOrders) },
  { path: '/billing', element: withSuspense(Billing) },
  { path: '/customers', element: withSuspense(CustomerManagement) },
  { path: '/items', element: withSuspense(ItemMaster) },
  { path: '/adjustments', element: withSuspense(InventoryAdjustments) },
  { path: '/equipment', element: withSuspense(EquipmentManagement) },
  { path: '/compliance', element: withSuspense(Compliance) },
  { path: '/zones', element: withSuspense(ZoneManagement) },
  { path: '/carriers', element: withSuspense(CarrierManagement) },
  { path: '/workorders', element: withSuspense(WorkOrders) },
  { path: '/promotions', element: withSuspense(PromotionsManagement) },
  { path: '/edi', element: withSuspense(EDIManagement) },
  { path: '/appointments', element: withSuspense(AppointmentScheduling) },
  { path: '/pallets', element: withSuspense(PalletManagement) },
  { path: '/parcel', element: withSuspense(ParcelShipping) },
  { path: '/documents', element: withSuspense(DocumentManagement) },
  { path: '/rma', element: withSuspense(RMAProcessing) },
  { path: '/forecast', element: withSuspense(DemandForecasting) },
  { path: '/serials', element: withSuspense(SerialTracking) },
  { path: '/freightaudit', element: withSuspense(FreightAudit) },
  { path: '/sla', element: withSuspense(SLAManagement) },
  { path: '/safety', element: withSuspense(SafetyManagement) },
  { path: '/workforce', element: withSuspense(WorkforceScheduling) },
  { path: '/capacity', element: withSuspense(CapacityPlanning) },
  { path: '/inbound', element: withSuspense(InboundPlanning) },
  { path: '/outbound', element: withSuspense(OutboundPlanning) },
  { path: '/clientportal', element: withSuspense(ClientPortal) },
  { path: '/costanalytics', element: withSuspense(CostAnalytics) },
  { path: '/productivity', element: withSuspense(ProductivityMetrics) },
  { path: '/notifications', element: withSuspense(NotificationCenter) },
  { path: '/systemhealth', element: withSuspense(SystemHealth) },
  { path: '/hazmat', element: withSuspense(HazmatManagement) },
  { path: '/vas', element: withSuspense(VASOperations) },
  { path: '/storagelocation', element: withSuspense(StorageLocationManager) },
  { path: '/inventorybalance', element: withSuspense(InventoryBalanceViewer) },
  { path: '/orderreceipt', element: withSuspense(OrderReceiptTracker) },
  { path: '/itemconfig', element: withSuspense(ItemConfiguration) },
  { path: '/warehousecontrols', element: withSuspense(WarehouseControls) },
  { path: '/pickperformance', element: withSuspense(PickPerformanceSetup) },
  { path: '/packagespecs', element: withSuspense(PackageSpecifications) },
  { path: '/facilityassignment', element: withSuspense(FacilityAssignmentPage) },
  { path: '/dimensionquery', element: withSuspense(DimensionQueryTool) },
  { path: '/locationmaintenance', element: withSuspense(LocationMaintenance) },
  { path: '/productboh', element: withSuspense(ProductBOHDetail) },
  { path: '/locationstatus', element: withSuspense(LocationStatusMaintenance) },
  { path: '/locationhistory', element: withSuspense(LocationHistoryBrowser) },
  { path: '/locationbrowser', element: withSuspense(LocationBrowser) },
  { path: '/availablelocation', element: withSuspense(AvailableLocationBrowser) },
  { path: '/batchslotadjust', element: withSuspense(BatchSlotAdjust) },
  { path: '/supplierreturns', element: withSuspense(SupplierReturns) },
  { path: '/adjustmenthistory', element: withSuspense(AdjustmentHistoryBrowser) },
  { path: '/movementaudit', element: withSuspense(MovementAuditLog) },
  { path: '/integrations', element: withSuspense(Integrations) },
  { path: '/reports', element: withSuspense(Reports) },
  { path: '/settings', element: withSuspense(Settings) },
]

// All routes combined (for backwards compatibility)
export const routes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  // Catch-all route redirects to dashboard
  { path: '*', element: withSuspense(Dashboard) },
]

// Page ID to path mapping for navigation
export const pageIdToPath: Record<string, string> = {
  dashboard: '/dashboard',
  receiving: '/receiving',
  picking: '/picking',
  orders: '/orders',
  inventory: '/inventory',
  returns: '/returns',
  labor: '/labor',
  warehouse: '/warehouse',
  quality: '/quality',
  replenishment: '/replenishment',
  mobile: '/mobile',
  abandon: '/abandon',
  locations: '/locations',
  markout: '/markout',
  casepack: '/casepack',
  cycle: '/cycle',
  shipping: '/shipping',
  dock: '/dock',
  yard: '/yard',
  tasks: '/tasks',
  lots: '/lots',
  waves: '/waves',
  alerts: '/alerts',
  slotting: '/slotting',
  cartonization: '/cartonization',
  loadplan: '/loadplan',
  audit: '/audit',
  users: '/users',
  kitting: '/kitting',
  crossdock: '/crossdock',
  asn: '/asn',
  vendors: '/vendors',
  pos: '/pos',
  billing: '/billing',
  customers: '/customers',
  items: '/items',
  adjustments: '/adjustments',
  equipment: '/equipment',
  compliance: '/compliance',
  zones: '/zones',
  carriers: '/carriers',
  workorders: '/workorders',
  promotions: '/promotions',
  edi: '/edi',
  appointments: '/appointments',
  pallets: '/pallets',
  parcel: '/parcel',
  documents: '/documents',
  rma: '/rma',
  forecast: '/forecast',
  serials: '/serials',
  freightaudit: '/freightaudit',
  sla: '/sla',
  safety: '/safety',
  workforce: '/workforce',
  capacity: '/capacity',
  inbound: '/inbound',
  outbound: '/outbound',
  clientportal: '/clientportal',
  costanalytics: '/costanalytics',
  productivity: '/productivity',
  notifications: '/notifications',
  systemhealth: '/systemhealth',
  hazmat: '/hazmat',
  vas: '/vas',
  storagelocation: '/storagelocation',
  inventorybalance: '/inventorybalance',
  orderreceipt: '/orderreceipt',
  itemconfig: '/itemconfig',
  warehousecontrols: '/warehousecontrols',
  pickperformance: '/pickperformance',
  packagespecs: '/packagespecs',
  facilityassignment: '/facilityassignment',
  dimensionquery: '/dimensionquery',
  locationmaintenance: '/locationmaintenance',
  productboh: '/productboh',
  locationstatus: '/locationstatus',
  locationhistory: '/locationhistory',
  locationbrowser: '/locationbrowser',
  availablelocation: '/availablelocation',
  batchslotadjust: '/batchslotadjust',
  supplierreturns: '/supplierreturns',
  adjustmenthistory: '/adjustmenthistory',
  movementaudit: '/movementaudit',
  integrations: '/integrations',
  reports: '/reports',
  settings: '/settings',
}

// Path to page ID mapping for determining current page from URL
export const pathToPageId: Record<string, string> = Object.fromEntries(
  Object.entries(pageIdToPath).map(([id, path]) => [path, id])
)
