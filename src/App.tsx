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
import { useWMSStore } from './store/useWMSStore'

type Page = 'dashboard' | 'receiving' | 'picking' | 'orders' | 'inventory' | 'returns' | 'labor' | 'reports' | 'settings'

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
