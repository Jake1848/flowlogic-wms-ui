import type { WMSConnector } from '../types/integrations'

export const WMS_CONNECTORS: WMSConnector[] = [
  {
    id: 'manhattan',
    name: 'Manhattan Associates',
    logo: 'M',
    description: 'Enterprise WMS for complex supply chain operations',
    features: ['Inventory Sync', 'Order Management', 'Labor Tracking', 'Receiving', 'Shipping'],
    methods: ['REST API', 'EDI', 'Database'],
    popular: true
  },
  {
    id: 'sap-ewm',
    name: 'SAP Extended Warehouse Management',
    logo: 'SAP',
    description: 'Integrated WMS for SAP ecosystem',
    features: ['Inventory Sync', 'Task Management', 'RF Operations', 'Slotting'],
    methods: ['REST API', 'BAPI', 'IDoc'],
    popular: true
  },
  {
    id: 'blue-yonder',
    name: 'Blue Yonder WMS',
    logo: 'BY',
    description: 'AI-powered warehouse management system',
    features: ['Demand Forecasting', 'Labor Optimization', 'Inventory Control'],
    methods: ['REST API', 'File Upload'],
    popular: true
  },
  {
    id: 'oracle-wms',
    name: 'Oracle WMS Cloud',
    logo: 'O',
    description: 'Cloud-native warehouse management',
    features: ['Inventory Visibility', 'Wave Planning', 'Shipping'],
    methods: ['REST API', 'Oracle Integration Cloud'],
    popular: true
  },
  {
    id: 'infor-wms',
    name: 'Infor WMS',
    logo: 'I',
    description: 'Industry-specific warehouse solutions',
    features: ['3PL Support', 'Multi-client', 'Billing'],
    methods: ['REST API', 'ION', 'File Upload'],
    popular: false
  },
  {
    id: 'korber',
    name: 'Korber WMS',
    logo: 'K',
    description: 'Flexible warehouse management platform',
    features: ['Inventory Control', 'Pick Optimization', 'Returns'],
    methods: ['REST API', 'File Upload'],
    popular: false
  },
  {
    id: 'highjump',
    name: 'HighJump (Korber)',
    logo: 'HJ',
    description: 'Adaptable WMS for diverse industries',
    features: ['RF Operations', 'Directed Work', 'Cycle Counting'],
    methods: ['REST API', 'Database', 'File Upload'],
    popular: false
  },
  {
    id: 'custom',
    name: 'Custom WMS',
    logo: '?',
    description: 'Connect to any WMS via flexible configuration',
    features: ['Custom Fields', 'Flexible Mapping', 'Any Protocol'],
    methods: ['REST API', 'SFTP', 'Database', 'File Upload'],
    popular: false
  }
]
