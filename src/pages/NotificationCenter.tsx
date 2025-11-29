import { useState } from 'react'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  Check,
  Filter,
  Settings,
  Clock,
} from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  category: 'inventory' | 'orders' | 'shipping' | 'system' | 'labor'
  actionUrl?: string
}

const mockNotifications: Notification[] = [
  {
    id: 'N001',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'SKU LAPTOP-PRO-15 has fallen below reorder point (5 units remaining)',
    timestamp: '2024-01-23T14:30:00',
    read: false,
    category: 'inventory',
    actionUrl: '/inventory',
  },
  {
    id: 'N002',
    type: 'error',
    title: 'SLA Breach Risk',
    message: 'Order ORD-2024-9876 is at risk of missing same-day shipping cutoff',
    timestamp: '2024-01-23T14:15:00',
    read: false,
    category: 'orders',
    actionUrl: '/orders',
  },
  {
    id: 'N003',
    type: 'success',
    title: 'Shipment Delivered',
    message: 'Inbound PO-2024-5678 has been fully received and put away',
    timestamp: '2024-01-23T13:45:00',
    read: false,
    category: 'shipping',
  },
  {
    id: 'N004',
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance window tonight 2:00 AM - 4:00 AM EST',
    timestamp: '2024-01-23T12:00:00',
    read: true,
    category: 'system',
  },
  {
    id: 'N005',
    type: 'warning',
    title: 'Labor Shortage',
    message: 'Picking department is understaffed for 2PM-6PM shift (2 workers short)',
    timestamp: '2024-01-23T11:30:00',
    read: true,
    category: 'labor',
    actionUrl: '/workforce',
  },
  {
    id: 'N006',
    type: 'success',
    title: 'Cycle Count Complete',
    message: 'Zone A-12 cycle count finished with 99.8% accuracy',
    timestamp: '2024-01-23T10:15:00',
    read: true,
    category: 'inventory',
  },
  {
    id: 'N007',
    type: 'error',
    title: 'Integration Error',
    message: 'Failed to sync orders from Shopify - connection timeout',
    timestamp: '2024-01-23T09:00:00',
    read: true,
    category: 'system',
    actionUrl: '/integrations',
  },
  {
    id: 'N008',
    type: 'info',
    title: 'New Carrier Rate',
    message: 'FedEx rate card update effective January 24, 2024',
    timestamp: '2024-01-23T08:00:00',
    read: true,
    category: 'shipping',
  },
]

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false
    if (filter !== 'all' && n.category !== filter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-gray-900 dark:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Categories</option>
            <option value="inventory">Inventory</option>
            <option value="orders">Orders</option>
            <option value="shipping">Shipping</option>
            <option value="labor">Labor</option>
            <option value="system">System</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Show unread only</span>
        </label>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: 'error', label: 'Critical', count: notifications.filter(n => n.type === 'error').length, color: 'red' },
          { type: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length, color: 'yellow' },
          { type: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length, color: 'green' },
          { type: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length, color: 'blue' },
        ].map((stat) => (
          <div
            key={stat.type}
            className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 border border-${stat.color}-200 dark:border-${stat.color}-800`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-${stat.color}-800 dark:text-${stat.color}-400 font-medium`}>
                {stat.label}
              </span>
              <span className={`text-2xl font-bold text-${stat.color}-600`}>{stat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl p-4 border transition-all ${
                notification.read
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : getTypeBg(notification.type)
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${
                      notification.read
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-900 dark:text-white font-semibold'
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.timestamp)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                      {notification.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
