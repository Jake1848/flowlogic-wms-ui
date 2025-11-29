import { useRoutes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AIAssistant from './components/AIAssistant'
import { useWMSStore } from './store/useWMSStore'
import { routes, pathToPageId } from './routes'

function App() {
  const { sidebarOpen } = useWMSStore()
  const location = useLocation()
  const routeElement = useRoutes(routes)

  // Determine current page from URL path
  const currentPage = pathToPageId[location.pathname] || 'dashboard'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {routeElement}
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}

export default App
