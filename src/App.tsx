import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Receiving from './pages/Receiving'
import Picking from './pages/Picking'
import Orders from './pages/Orders'
import Labor from './pages/Labor'
import Returns from './pages/Returns'
import Integrations from './pages/Integrations'
import Warehouse from './pages/Warehouse'
import QualityControl from './pages/QualityControl'
import Replenishment from './pages/Replenishment'
import MobileScanner from './pages/MobileScanner'
import AbandonCodes from './pages/AbandonCodes'
import LocationAssignments from './pages/LocationAssignments'
import MarkoutProcess from './pages/MarkoutProcess'
import CasePackManagement from './pages/CasePackManagement'
import CycleCounting from './pages/CycleCounting'
import Shipping from './pages/Shipping'
import DockScheduling from './pages/DockScheduling'
import YardManagement from './pages/YardManagement'
import TaskManagement from './pages/TaskManagement'
import LotTracking from './pages/LotTracking'
import WavePlanning from './pages/WavePlanning'
import Alerts from './pages/Alerts'
import Slotting from './pages/Slotting'
import Cartonization from './pages/Cartonization'
import LoadPlanning from './pages/LoadPlanning'
import AuditTrail from './pages/AuditTrail'
import UserManagement from './pages/UserManagement'
import KitBuilding from './pages/KitBuilding'
import CrossDocking from './pages/CrossDocking'
import ASNManagement from './pages/ASNManagement'
import VendorManagement from './pages/VendorManagement'
import PurchaseOrders from './pages/PurchaseOrders'
import Billing from './pages/Billing'
import CustomerManagement from './pages/CustomerManagement'
import ItemMaster from './pages/ItemMaster'
import InventoryAdjustments from './pages/InventoryAdjustments'
import EquipmentManagement from './pages/EquipmentManagement'
import Compliance from './pages/Compliance'
import ZoneManagement from './pages/ZoneManagement'
import CarrierManagement from './pages/CarrierManagement'
import WorkOrders from './pages/WorkOrders'
import PromotionsManagement from './pages/PromotionsManagement'
import EDIManagement from './pages/EDIManagement'
import AppointmentScheduling from './pages/AppointmentScheduling'
import PalletManagement from './pages/PalletManagement'
import ParcelShipping from './pages/ParcelShipping'
import DocumentManagement from './pages/DocumentManagement'
import RMAProcessing from './pages/RMAProcessing'
import DemandForecasting from './pages/DemandForecasting'
import SerialTracking from './pages/SerialTracking'
import FreightAudit from './pages/FreightAudit'
import SLAManagement from './pages/SLAManagement'
import SafetyManagement from './pages/SafetyManagement'
import WorkforceScheduling from './pages/WorkforceScheduling'
import CapacityPlanning from './pages/CapacityPlanning'
import InboundPlanning from './pages/InboundPlanning'
import OutboundPlanning from './pages/OutboundPlanning'
import ClientPortal from './pages/ClientPortal'
import CostAnalytics from './pages/CostAnalytics'
import ProductivityMetrics from './pages/ProductivityMetrics'
import NotificationCenter from './pages/NotificationCenter'
import SystemHealth from './pages/SystemHealth'
import HazmatManagement from './pages/HazmatManagement'
import VASOperations from './pages/VASOperations'
import StorageLocationManager from './pages/StorageLocationManager'
import InventoryBalanceViewer from './pages/InventoryBalanceViewer'
import OrderReceiptTracker from './pages/OrderReceiptTracker'
import ItemConfiguration from './pages/ItemConfiguration'
import WarehouseControls from './pages/WarehouseControls'
import PickPerformanceSetup from './pages/PickPerformanceSetup'
import PackageSpecifications from './pages/PackageSpecifications'
import FacilityAssignmentPage from './pages/FacilityAssignment'
import DimensionQueryTool from './pages/DimensionQueryTool'
import LocationMaintenance from './pages/LocationMaintenance'
import ProductBOHDetail from './pages/ProductBOHDetail'
import LocationStatusMaintenance from './pages/LocationStatusMaintenance'
import LocationHistoryBrowser from './pages/LocationHistoryBrowser'
import LocationBrowser from './pages/LocationBrowser'
import AvailableLocationBrowser from './pages/AvailableLocationBrowser'
import BatchSlotAdjust from './pages/BatchSlotAdjust'
import SupplierReturns from './pages/SupplierReturns'
import AdjustmentHistoryBrowser from './pages/AdjustmentHistoryBrowser'
import MovementAuditLog from './pages/MovementAuditLog'
import AIAssistant from './components/AIAssistant'
import { useWMSStore } from './store/useWMSStore'

type Page = 'dashboard' | 'receiving' | 'picking' | 'orders' | 'inventory' | 'returns' | 'labor' | 'warehouse' | 'quality' | 'replenishment' | 'mobile' | 'abandon' | 'locations' | 'markout' | 'casepack' | 'cycle' | 'shipping' | 'dock' | 'yard' | 'tasks' | 'lots' | 'waves' | 'alerts' | 'slotting' | 'cartonization' | 'loadplan' | 'audit' | 'users' | 'kitting' | 'crossdock' | 'asn' | 'vendors' | 'pos' | 'billing' | 'customers' | 'items' | 'adjustments' | 'equipment' | 'compliance' | 'zones' | 'carriers' | 'workorders' | 'promotions' | 'edi' | 'appointments' | 'pallets' | 'parcel' | 'documents' | 'rma' | 'forecast' | 'serials' | 'freightaudit' | 'sla' | 'safety' | 'workforce' | 'capacity' | 'inbound' | 'outbound' | 'clientportal' | 'costanalytics' | 'productivity' | 'notifications' | 'systemhealth' | 'hazmat' | 'vas' | 'storagelocation' | 'inventorybalance' | 'orderreceipt' | 'itemconfig' | 'warehousecontrols' | 'pickperformance' | 'packagespecs' | 'facilityassignment' | 'dimensionquery' | 'locationmaintenance' | 'productboh' | 'locationstatus' | 'locationhistory' | 'locationbrowser' | 'availablelocation' | 'batchslotadjust' | 'supplierreturns' | 'adjustmenthistory' | 'movementaudit' | 'integrations' | 'reports' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { sidebarOpen } = useWMSStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'receiving':
        return <Receiving />
      case 'picking':
        return <Picking />
      case 'orders':
        return <Orders />
      case 'inventory':
        return <Inventory />
      case 'returns':
        return <Returns />
      case 'labor':
        return <Labor />
      case 'warehouse':
        return <Warehouse />
      case 'quality':
        return <QualityControl />
      case 'replenishment':
        return <Replenishment />
      case 'mobile':
        return <MobileScanner />
      case 'abandon':
        return <AbandonCodes />
      case 'locations':
        return <LocationAssignments />
      case 'markout':
        return <MarkoutProcess />
      case 'casepack':
        return <CasePackManagement />
      case 'cycle':
        return <CycleCounting />
      case 'shipping':
        return <Shipping />
      case 'dock':
        return <DockScheduling />
      case 'yard':
        return <YardManagement />
      case 'tasks':
        return <TaskManagement />
      case 'lots':
        return <LotTracking />
      case 'waves':
        return <WavePlanning />
      case 'alerts':
        return <Alerts />
      case 'slotting':
        return <Slotting />
      case 'cartonization':
        return <Cartonization />
      case 'loadplan':
        return <LoadPlanning />
      case 'audit':
        return <AuditTrail />
      case 'users':
        return <UserManagement />
      case 'kitting':
        return <KitBuilding />
      case 'crossdock':
        return <CrossDocking />
      case 'asn':
        return <ASNManagement />
      case 'vendors':
        return <VendorManagement />
      case 'pos':
        return <PurchaseOrders />
      case 'billing':
        return <Billing />
      case 'customers':
        return <CustomerManagement />
      case 'items':
        return <ItemMaster />
      case 'adjustments':
        return <InventoryAdjustments />
      case 'equipment':
        return <EquipmentManagement />
      case 'compliance':
        return <Compliance />
      case 'zones':
        return <ZoneManagement />
      case 'carriers':
        return <CarrierManagement />
      case 'workorders':
        return <WorkOrders />
      case 'promotions':
        return <PromotionsManagement />
      case 'edi':
        return <EDIManagement />
      case 'appointments':
        return <AppointmentScheduling />
      case 'pallets':
        return <PalletManagement />
      case 'parcel':
        return <ParcelShipping />
      case 'documents':
        return <DocumentManagement />
      case 'rma':
        return <RMAProcessing />
      case 'forecast':
        return <DemandForecasting />
      case 'serials':
        return <SerialTracking />
      case 'freightaudit':
        return <FreightAudit />
      case 'sla':
        return <SLAManagement />
      case 'safety':
        return <SafetyManagement />
      case 'workforce':
        return <WorkforceScheduling />
      case 'capacity':
        return <CapacityPlanning />
      case 'inbound':
        return <InboundPlanning />
      case 'outbound':
        return <OutboundPlanning />
      case 'clientportal':
        return <ClientPortal />
      case 'costanalytics':
        return <CostAnalytics />
      case 'productivity':
        return <ProductivityMetrics />
      case 'notifications':
        return <NotificationCenter />
      case 'systemhealth':
        return <SystemHealth />
      case 'hazmat':
        return <HazmatManagement />
      case 'vas':
        return <VASOperations />
      case 'storagelocation':
        return <StorageLocationManager />
      case 'inventorybalance':
        return <InventoryBalanceViewer />
      case 'orderreceipt':
        return <OrderReceiptTracker />
      case 'itemconfig':
        return <ItemConfiguration />
      case 'warehousecontrols':
        return <WarehouseControls />
      case 'pickperformance':
        return <PickPerformanceSetup />
      case 'packagespecs':
        return <PackageSpecifications />
      case 'facilityassignment':
        return <FacilityAssignmentPage />
      case 'dimensionquery':
        return <DimensionQueryTool />
      case 'locationmaintenance':
        return <LocationMaintenance />
      case 'productboh':
        return <ProductBOHDetail />
      case 'locationstatus':
        return <LocationStatusMaintenance />
      case 'locationhistory':
        return <LocationHistoryBrowser />
      case 'locationbrowser':
        return <LocationBrowser />
      case 'availablelocation':
        return <AvailableLocationBrowser />
      case 'batchslotadjust':
        return <BatchSlotAdjust />
      case 'supplierreturns':
        return <SupplierReturns />
      case 'adjustmenthistory':
        return <AdjustmentHistoryBrowser />
      case 'movementaudit':
        return <MovementAuditLog />
      case 'integrations':
        return <Integrations />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}

export default App
