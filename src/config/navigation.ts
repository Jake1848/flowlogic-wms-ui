import {
  Brain,
  Bell,
  BellRing,
  TrendingUp,
  Calculator,
  Zap,
  FileText,
  Activity,
  ArrowRightLeft,
  History,
  UserCog,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

export type PageType = 'intelligence' | 'alerts' | 'notifications' | 'reports' | 'costanalytics' | 'productivity' | 'systemhealth' | 'integrations' | 'audit' | 'users' | 'settings' | 'billing'

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
  'IQ': 'intelligence', 'AIQ': 'intelligence', 'INT': 'intelligence', 'AI': 'intelligence',
  'ALC': 'alerts', 'ALERTS': 'alerts',
  'NTF': 'notifications', 'NOTIFY': 'notifications',
  'RPT': 'reports', 'REPORTS': 'reports',
  'CST': 'costanalytics', 'COST': 'costanalytics',
  'PRD': 'productivity', 'PROD': 'productivity',
  'SYS': 'systemhealth', 'HEALTH': 'systemhealth',
  'WMS': 'integrations', 'CONNECT': 'integrations',
  'AUD': 'audit', 'AUDIT': 'audit',
  'USR': 'users', 'USERS': 'users',
  'SET': 'settings', 'CONFIG': 'settings',
  'BIL': 'billing', 'BILLING': 'billing', 'PAY': 'billing',
}

/**
 * Main navigation menu structure
 * Organized for AI Intelligence Platform
 */
export const menuGroups: MenuGroup[] = [
  {
    id: 'intelligence',
    label: 'AI Intelligence',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    items: [
      { id: 'intelligence', label: 'Intelligence Dashboard', icon: Brain, code: 'IQ' },
      { id: 'alerts', label: 'AI Alerts', icon: Bell, code: 'ALC' },
      { id: 'notifications', label: 'Notifications', icon: BellRing, code: 'NTF' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    icon: TrendingUp,
    color: 'from-cyan-500 to-blue-600',
    items: [
      { id: 'costanalytics', label: 'Cost Analytics', icon: Calculator, code: 'CST' },
      { id: 'productivity', label: 'Productivity Metrics', icon: Zap, code: 'PRD' },
      { id: 'reports', label: 'Reports', icon: FileText, code: 'RPT' },
    ],
  },
  {
    id: 'system',
    label: 'System & Connections',
    icon: Activity,
    color: 'from-emerald-500 to-teal-600',
    items: [
      { id: 'integrations', label: 'WMS Integrations', icon: ArrowRightLeft, code: 'WMS' },
      { id: 'systemhealth', label: 'System Health', icon: Activity, code: 'SYS' },
      { id: 'audit', label: 'Audit Trail', icon: History, code: 'AUD' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    color: 'from-gray-500 to-slate-600',
    items: [
      { id: 'users', label: 'User Management', icon: UserCog, code: 'USR' },
      { id: 'billing', label: 'Billing & Plans', icon: CreditCard, code: 'BIL' },
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
