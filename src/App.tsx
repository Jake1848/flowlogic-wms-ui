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
import { useWMSStore } from './store/useWMSStore'

type Page = 'dashboard' | 'receiving' | 'picking' | 'orders' | 'inventory' | 'returns' | 'labor' | 'warehouse' | 'quality' | 'replenishment' | 'mobile' | 'abandon' | 'locations' | 'markout' | 'casepack' | 'cycle' | 'shipping' | 'dock' | 'yard' | 'tasks' | 'lots' | 'waves' | 'alerts' | 'integrations' | 'reports' | 'settings'

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
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
