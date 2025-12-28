export interface Integration {
  id: string
  name: string
  type: 'ERP' | 'TMS' | 'WMS' | 'E-Commerce' | 'Other'
  provider: string
  method: 'REST API' | 'EDI' | 'SFTP' | 'Database' | 'Webhook' | 'File Upload'
  status: 'connected' | 'error' | 'syncing' | 'disabled' | 'pending'
  lastSync: string | null
  endpoint?: string
  dataFlow: 'inbound' | 'outbound' | 'bidirectional'
  syncFrequency: string
  recordsToday: number
  config?: Record<string, string>
}

export interface WMSConnector {
  id: string
  name: string
  logo: string
  description: string
  features: string[]
  methods: string[]
  popular: boolean
}

export interface DataMapping {
  id: string
  sourceSystem: string
  sourceField: string
  targetField: string
  transformation?: string
  active: boolean
}

export interface SyncLog {
  id: string
  integrationId: string
  integrationName: string
  status: 'success' | 'error' | 'warning'
  message: string
  recordCount: number
  timestamp: string
}

export type IntegrationTab = 'systems' | 'connectors' | 'mappings' | 'logs'
