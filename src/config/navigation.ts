import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  TruckIcon,
  ClipboardList,
  ShoppingCart,
  Users,
  PackageX,
  ArrowRightLeft,
  Grid3x3,
  ClipboardCheck,
  ArrowUp,
  Smartphone,
  AlertTriangle,
  MapPin,
  Search,
  Boxes,
  ListChecks,
  Send,
  DoorOpen,
  Container,
  ListTodo,
  Hash,
  Layers,
  Bell,
  Target,
  BoxSelect,
  Truck,
  History,
  UserCog,
  Wrench,
  Shuffle,
  FileInput,
  Building2,
  ShoppingBag,
  Receipt,
  Contact,
  Database,
  ListMinus,
  Forklift,
  Shield,
  Map,
  Plane,
  ClipboardEdit,
  Tag,
  FileCode,
  CalendarClock,
  Mail,
  FileText as FileDoc,
  SquareStack,
  RotateCcw,
  TrendingUp,
  ScanBarcode,
  Scale,
  Timer,
  HardHat,
  CalendarDays,
  Gauge,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users2,
  Calculator,
  Zap,
  BellRing,
  Activity,
  Flame,
  Sparkles,
  Warehouse as WarehouseIcon,
  Box,
  BarChart3,
  Cog,
  LucideIcon,
} from 'lucide-react'

export type PageType = 'dashboard' | 'receiving' | 'picking' | 'orders' | 'inventory' | 'returns' | 'labor' | 'warehouse' | 'quality' | 'replenishment' | 'mobile' | 'abandon' | 'locations' | 'markout' | 'casepack' | 'cycle' | 'shipping' | 'dock' | 'yard' | 'tasks' | 'lots' | 'waves' | 'alerts' | 'slotting' | 'cartonization' | 'loadplan' | 'audit' | 'users' | 'kitting' | 'crossdock' | 'asn' | 'vendors' | 'pos' | 'billing' | 'customers' | 'items' | 'adjustments' | 'equipment' | 'compliance' | 'zones' | 'carriers' | 'workorders' | 'promotions' | 'edi' | 'appointments' | 'pallets' | 'parcel' | 'documents' | 'rma' | 'forecast' | 'serials' | 'freightaudit' | 'sla' | 'safety' | 'workforce' | 'capacity' | 'inbound' | 'outbound' | 'clientportal' | 'costanalytics' | 'productivity' | 'notifications' | 'systemhealth' | 'hazmat' | 'vas' | 'storagelocation' | 'inventorybalance' | 'orderreceipt' | 'itemconfig' | 'warehousecontrols' | 'pickperformance' | 'packagespecs' | 'facilityassignment' | 'dimensionquery' | 'locationmaintenance' | 'productboh' | 'locationstatus' | 'locationhistory' | 'locationbrowser' | 'availablelocation' | 'batchslotadjust' | 'supplierreturns' | 'adjustmenthistory' | 'movementaudit' | 'integrations' | 'reports' | 'settings'

export interface MenuItem {
  id: PageType
  label: string
  icon: LucideIcon
  code: string
}

export interface MenuGroup {
  id: string
  label: string
  icon: LucideIcon
  color: string
  items: MenuItem[]
}

/**
 * Transaction code mapping for quick navigation (Ctrl+K)
 * Maps transaction codes to page IDs
 */
export const transactionCodes: Record<string, PageType> = {
  'DSH': 'dashboard', 'DASHBOARD': 'dashboard',
  'RCV': 'receiving', 'ASN': 'asn', 'ORT': 'orderreceipt', 'PO': 'pos',
  'APT': 'appointments', 'QC': 'quality', 'DCK': 'dock', 'YRD': 'yard',
  'INV': 'inventory', 'SLM': 'storagelocation', 'IBV': 'inventorybalance',
  'PBD': 'productboh', 'ADJ': 'adjustments', 'CYC': 'cycle', 'LOT': 'lots',
  'SER': 'serials', 'HAZ': 'hazmat',
  'LMT': 'locationmaintenance', 'LSM': 'locationstatus', 'LHB': 'locationhistory',
  'LBRS': 'locationbrowser', 'ALB': 'availablelocation', 'LOC': 'locations',
  'ZON': 'zones', 'SLT': 'slotting',
  'ORD': 'orders', 'WAV': 'waves', 'TSK': 'tasks', 'ALC': 'alerts',
  'PCK': 'picking', 'RPL': 'replenishment', 'CTN': 'cartonization',
  'KIT': 'kitting', 'VAS': 'vas',
  'SHP': 'shipping', 'LDP': 'loadplan', 'CAR': 'carriers', 'PAR': 'parcel',
  'FRT': 'freightaudit',
  'RTN': 'returns', 'RMA': 'rma', 'XDK': 'crossdock',
  'ITM': 'items', 'ICF': 'itemconfig', 'PKS': 'packagespecs', 'DQT': 'dimensionquery',
  'CPK': 'casepack', 'MRK': 'markout', 'ABN': 'abandon',
  'WHC': 'warehousecontrols', 'FAM': 'facilityassignment', 'PPS': 'pickperformance',
  'WHS': 'warehouse', 'EQP': 'equipment', 'PLT': 'pallets',
  'LAB': 'labor', 'WRK': 'workforce', 'USR': 'users', 'SFT': 'safety',
  'CAP': 'capacity', 'IBP': 'inbound', 'OBP': 'outbound', 'FCT': 'forecast',
  'PRD': 'productivity', 'CST': 'costanalytics', 'RPT': 'reports',
  'VND': 'vendors', 'CUS': 'customers', 'BIL': 'billing', 'SLA': 'sla',
  'CMP': 'compliance', 'PRM': 'promotions', 'CLI': 'clientportal',
  'EDI': 'edi', 'INT': 'integrations', 'DMS': 'documents', 'AUD': 'audit',
  'NTF': 'notifications', 'SYS': 'systemhealth', 'SET': 'settings',
  'MOB': 'mobile', 'WOD': 'workorders',
  'SIA': 'adjustments', 'BSA': 'batchslotadjust', 'VRM': 'supplierreturns',
  'AHB': 'adjustmenthistory', 'MAL': 'movementaudit',
}

/**
 * Main navigation menu structure
 * Organized by functional areas of the WMS
 */
export const menuGroups: MenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'from-violet-500 to-purple-600',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, code: 'DSH' },
      { id: 'alerts', label: 'Alerts', icon: Bell, code: 'ALC' },
      { id: 'notifications', label: 'Notifications', icon: BellRing, code: 'NTF' },
    ],
  },
  {
    id: 'receiving',
    label: 'Receiving',
    icon: TruckIcon,
    color: 'from-emerald-500 to-teal-600',
    items: [
      { id: 'receiving', label: 'Receiving', icon: TruckIcon, code: 'RCV' },
      { id: 'asn', label: 'ASN Management', icon: FileInput, code: 'ASN' },
      { id: 'orderreceipt', label: 'Order Receipt Tracker', icon: Receipt, code: 'ORT' },
      { id: 'pos', label: 'Purchase Orders', icon: ShoppingBag, code: 'PO' },
      { id: 'appointments', label: 'Appointments', icon: CalendarClock, code: 'APT' },
      { id: 'quality', label: 'Quality Control', icon: ClipboardCheck, code: 'QC' },
      { id: 'dock', label: 'Dock Scheduling', icon: DoorOpen, code: 'DCK' },
      { id: 'yard', label: 'Yard Management', icon: Container, code: 'YRD' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory Control',
    icon: Package,
    color: 'from-blue-500 to-cyan-600',
    items: [
      { id: 'inventory', label: 'Inventory Overview', icon: Package, code: 'INV' },
      { id: 'storagelocation', label: 'Storage Location Mgr', icon: MapPin, code: 'SLM' },
      { id: 'inventorybalance', label: 'Inventory Balance', icon: Package, code: 'IBV' },
      { id: 'productboh', label: 'Product BOH Detail', icon: Package, code: 'PBD' },
      { id: 'adjustments', label: 'Single Item Adjust', icon: ListMinus, code: 'SIA' },
      { id: 'batchslotadjust', label: 'Batch Slot Adjust', icon: Boxes, code: 'BSA' },
      { id: 'adjustmenthistory', label: 'Adjustment History', icon: History, code: 'AHB' },
      { id: 'movementaudit', label: 'Movement Audit Log', icon: History, code: 'MAL' },
      { id: 'cycle', label: 'Cycle Counting', icon: ListChecks, code: 'CYC' },
      { id: 'lots', label: 'Lot Tracking', icon: Hash, code: 'LOT' },
      { id: 'serials', label: 'Serial Tracking', icon: ScanBarcode, code: 'SER' },
      { id: 'hazmat', label: 'Hazmat Management', icon: Flame, code: 'HAZ' },
    ],
  },
  {
    id: 'locations',
    label: 'Location Management',
    icon: MapPin,
    color: 'from-amber-500 to-orange-600',
    items: [
      { id: 'locationmaintenance', label: 'Location Maintenance', icon: MapPin, code: 'LMT' },
      { id: 'locationstatus', label: 'Location Status Maint', icon: ClipboardCheck, code: 'LSM' },
      { id: 'locationhistory', label: 'Location History', icon: History, code: 'LHB' },
      { id: 'locationbrowser', label: 'Location Browser', icon: Search, code: 'LBRS' },
      { id: 'availablelocation', label: 'Available Locations', icon: MapPin, code: 'ALB' },
      { id: 'locations', label: 'Location Assignments', icon: MapPin, code: 'LOC' },
      { id: 'zones', label: 'Zone Management', icon: Map, code: 'ZON' },
      { id: 'slotting', label: 'Slotting', icon: Target, code: 'SLT' },
    ],
  },
  {
    id: 'orders',
    label: 'Order Management',
    icon: ShoppingCart,
    color: 'from-pink-500 to-rose-600',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingCart, code: 'ORD' },
      { id: 'waves', label: 'Wave Planning', icon: Layers, code: 'WAV' },
      { id: 'tasks', label: 'Task Queue', icon: ListTodo, code: 'TSK' },
    ],
  },
  {
    id: 'picking',
    label: 'Picking & Packing',
    icon: ClipboardList,
    color: 'from-indigo-500 to-blue-600',
    items: [
      { id: 'picking', label: 'Picking', icon: ClipboardList, code: 'PCK' },
      { id: 'replenishment', label: 'Replenishment', icon: ArrowUp, code: 'RPL' },
      { id: 'cartonization', label: 'Cartonization', icon: BoxSelect, code: 'CTN' },
      { id: 'kitting', label: 'Kit Building', icon: Wrench, code: 'KIT' },
      { id: 'vas', label: 'VAS Operations', icon: Sparkles, code: 'VAS' },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping & Logistics',
    icon: Send,
    color: 'from-sky-500 to-blue-600',
    items: [
      { id: 'shipping', label: 'Shipping', icon: Send, code: 'SHP' },
      { id: 'loadplan', label: 'Load Planning', icon: Truck, code: 'LDP' },
      { id: 'carriers', label: 'Carrier Management', icon: Plane, code: 'CAR' },
      { id: 'parcel', label: 'Parcel Shipping', icon: Mail, code: 'PAR' },
      { id: 'freightaudit', label: 'Freight Audit', icon: Scale, code: 'FRT' },
    ],
  },
  {
    id: 'returns',
    label: 'Returns',
    icon: PackageX,
    color: 'from-red-500 to-rose-600',
    items: [
      { id: 'returns', label: 'Returns', icon: PackageX, code: 'RTN' },
      { id: 'supplierreturns', label: 'Supplier Returns', icon: Building2, code: 'VRM' },
      { id: 'rma', label: 'RMA Processing', icon: RotateCcw, code: 'RMA' },
      { id: 'crossdock', label: 'Cross-Docking', icon: Shuffle, code: 'XDK' },
    ],
  },
  {
    id: 'products',
    label: 'Product Management',
    icon: Database,
    color: 'from-fuchsia-500 to-pink-600',
    items: [
      { id: 'items', label: 'Item Master', icon: Database, code: 'ITM' },
      { id: 'itemconfig', label: 'Item Configuration', icon: Settings, code: 'ICF' },
      { id: 'packagespecs', label: 'Package Specifications', icon: Box, code: 'PKS' },
      { id: 'dimensionquery', label: 'Dimension Query', icon: Search, code: 'DQT' },
      { id: 'casepack', label: 'Case Pack Mgmt', icon: Boxes, code: 'CPK' },
      { id: 'markout', label: 'Mark Out Process', icon: Search, code: 'MRK' },
      { id: 'abandon', label: 'Abandon Codes', icon: AlertTriangle, code: 'ABN' },
    ],
  },
  {
    id: 'warehouse',
    label: 'Warehouse Setup',
    icon: WarehouseIcon,
    color: 'from-slate-500 to-gray-600',
    items: [
      { id: 'warehouse', label: 'Warehouse Overview', icon: Grid3x3, code: 'WHS' },
      { id: 'warehousecontrols', label: 'Warehouse Controls', icon: WarehouseIcon, code: 'WHC' },
      { id: 'facilityassignment', label: 'Facility Assignment', icon: Building2, code: 'FAM' },
      { id: 'pickperformance', label: 'Pick Performance', icon: Activity, code: 'PPS' },
      { id: 'equipment', label: 'Equipment', icon: Forklift, code: 'EQP' },
      { id: 'pallets', label: 'Pallet Management', icon: SquareStack, code: 'PLT' },
    ],
  },
  {
    id: 'labor',
    label: 'Labor & Workforce',
    icon: Users,
    color: 'from-lime-500 to-green-600',
    items: [
      { id: 'labor', label: 'Labor Management', icon: Users, code: 'LAB' },
      { id: 'workforce', label: 'Workforce Scheduling', icon: CalendarDays, code: 'WRK' },
      { id: 'users', label: 'User Management', icon: UserCog, code: 'USR' },
      { id: 'safety', label: 'Safety Management', icon: HardHat, code: 'SFT' },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & Analytics',
    icon: BarChart3,
    color: 'from-cyan-500 to-teal-600',
    items: [
      { id: 'capacity', label: 'Capacity Planning', icon: Gauge, code: 'CAP' },
      { id: 'inbound', label: 'Inbound Planning', icon: ArrowDownToLine, code: 'IBP' },
      { id: 'outbound', label: 'Outbound Planning', icon: ArrowUpFromLine, code: 'OBP' },
      { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp, code: 'FCT' },
      { id: 'productivity', label: 'Productivity Metrics', icon: Zap, code: 'PRD' },
      { id: 'costanalytics', label: 'Cost Analytics', icon: Calculator, code: 'CST' },
      { id: 'reports', label: 'Reports', icon: FileText, code: 'RPT' },
    ],
  },
  {
    id: 'partners',
    label: 'Partners & Compliance',
    icon: Building2,
    color: 'from-orange-500 to-amber-600',
    items: [
      { id: 'vendors', label: 'Vendor Management', icon: Building2, code: 'VND' },
      { id: 'customers', label: 'Customer Management', icon: Contact, code: 'CUS' },
      { id: 'billing', label: '3PL Billing', icon: Receipt, code: 'BIL' },
      { id: 'sla', label: 'SLA Management', icon: Timer, code: 'SLA' },
      { id: 'compliance', label: 'Compliance', icon: Shield, code: 'CMP' },
      { id: 'promotions', label: 'Promotions', icon: Tag, code: 'PRM' },
      { id: 'clientportal', label: 'Client Portal', icon: Users2, code: 'CLI' },
    ],
  },
  {
    id: 'system',
    label: 'System & Admin',
    icon: Cog,
    color: 'from-gray-500 to-slate-600',
    items: [
      { id: 'edi', label: 'EDI Management', icon: FileCode, code: 'EDI' },
      { id: 'integrations', label: 'Integrations', icon: ArrowRightLeft, code: 'INT' },
      { id: 'documents', label: 'Documents', icon: FileDoc, code: 'DMS' },
      { id: 'audit', label: 'Audit Trail', icon: History, code: 'AUD' },
      { id: 'systemhealth', label: 'System Health', icon: Activity, code: 'SYS' },
      { id: 'workorders', label: 'Work Orders', icon: ClipboardEdit, code: 'WOD' },
      { id: 'mobile', label: 'Mobile/Scanner', icon: Smartphone, code: 'MOB' },
      { id: 'settings', label: 'Settings', icon: Settings, code: 'SET' },
    ],
  },
]

/**
 * Get the label for a page by its ID
 */
export function getPageLabel(pageId: PageType): string {
  for (const group of menuGroups) {
    const item = group.items.find(i => i.id === pageId)
    if (item) return item.label
  }
  return pageId
}

/**
 * Get the menu group that contains a page
 */
export function getPageGroup(pageId: PageType): MenuGroup | undefined {
  return menuGroups.find(g => g.items.some(i => i.id === pageId))
}

/**
 * Find a page by its transaction code
 */
export function getPageByCode(code: string): PageType | undefined {
  return transactionCodes[code.toUpperCase()]
}
