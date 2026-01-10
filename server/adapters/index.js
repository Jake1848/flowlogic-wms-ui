/**
 * FlowLogic WMS Adapter Factory
 *
 * Creates the appropriate WMS adapter based on integration type.
 * Provides a unified interface for all WMS connections.
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from './base/index.js';
import { SAPEWMAdapter } from './sap/index.js';
import { ManhattanAdapter } from './manhattan/index.js';
import { BlueYonderAdapter } from './blue-yonder/index.js';
import { OracleWMSAdapter } from './oracle/index.js';
import { GenericAdapter } from './csv/index.js';

/**
 * Supported adapter types
 */
export const AdapterTypes = {
  SAP: 'sap-ewm',
  SAP_EWM: 'sap-ewm',
  MANHATTAN: 'manhattan',
  BLUE_YONDER: 'blue-yonder',
  BLUE_YONDER_JDA: 'blue-yonder',
  JDA: 'blue-yonder',
  ORACLE: 'oracle-wms',
  ORACLE_WMS: 'oracle-wms',
  INFOR: 'infor',
  KORBER: 'korber',
  HIGHJUMP: 'highjump',
  GENERIC: 'custom',
  CUSTOM: 'custom',
  CSV: 'csv',
  FILE: 'file'
};

/**
 * Map integration types from database to adapter types
 */
const INTEGRATION_TYPE_MAP = {
  // Database IntegrationType enum values
  'SAP': AdapterTypes.SAP,
  'MANHATTAN': AdapterTypes.MANHATTAN,
  'BLUE_YONDER': AdapterTypes.BLUE_YONDER,
  'ORACLE': AdapterTypes.ORACLE,
  'INFOR': AdapterTypes.INFOR,
  'KORBER': AdapterTypes.KORBER,
  'HIGHJUMP': AdapterTypes.HIGHJUMP,
  'CUSTOM_WMS': AdapterTypes.CUSTOM,
  'API': AdapterTypes.CUSTOM,
  'FTP': AdapterTypes.CUSTOM,

  // Alternative names
  'sap-ewm': AdapterTypes.SAP,
  'sap': AdapterTypes.SAP,
  'manhattan': AdapterTypes.MANHATTAN,
  'blue-yonder': AdapterTypes.BLUE_YONDER,
  'jda': AdapterTypes.BLUE_YONDER,
  'oracle-wms': AdapterTypes.ORACLE,
  'oracle': AdapterTypes.ORACLE,
  'custom': AdapterTypes.CUSTOM,
  'generic': AdapterTypes.CUSTOM
};

/**
 * Create a WMS adapter instance based on configuration
 *
 * @param {Object} integration - Integration configuration from database
 * @returns {BaseWMSAdapter} Configured adapter instance
 */
export function createAdapter(integration) {
  const type = normalizeAdapterType(integration.type);
  const config = buildAdapterConfig(integration);

  switch (type) {
    case AdapterTypes.SAP:
      return new SAPEWMAdapter(config);

    case AdapterTypes.MANHATTAN:
      return new ManhattanAdapter(config);

    case AdapterTypes.BLUE_YONDER:
      return new BlueYonderAdapter(config);

    case AdapterTypes.ORACLE:
      return new OracleWMSAdapter(config);

    case AdapterTypes.INFOR:
    case AdapterTypes.KORBER:
    case AdapterTypes.HIGHJUMP:
      // These use generic adapter with specific configurations
      return new GenericAdapter({
        ...config,
        type: type
      });

    case AdapterTypes.GENERIC:
    case AdapterTypes.CUSTOM:
    default:
      return new GenericAdapter(config);
  }
}

/**
 * Normalize adapter type string
 */
function normalizeAdapterType(type) {
  if (!type) return AdapterTypes.CUSTOM;

  const normalized = type.toString().toUpperCase().replace(/-/g, '_');
  return INTEGRATION_TYPE_MAP[type] || INTEGRATION_TYPE_MAP[normalized] || AdapterTypes.CUSTOM;
}

/**
 * Build adapter configuration from integration record
 */
function buildAdapterConfig(integration) {
  const settings = integration.settings || {};

  return {
    // Basic info
    id: integration.id,
    name: integration.name,
    type: integration.type,

    // Connection settings
    endpoint: integration.endpoint,
    baseUrl: integration.endpoint,

    // Authentication
    apiKey: integration.apiKey,
    apiSecret: integration.apiSecret,
    username: integration.username,
    password: integration.password,

    // Merged settings from JSON field
    ...settings,

    // Common optional settings
    facilityId: settings.facilityId,
    warehouseNumber: settings.warehouseNumber,
    organizationId: settings.organizationId,
    companyId: settings.companyId,
    tenantId: settings.tenantId,
    clientId: settings.clientId || integration.apiKey,
    clientSecret: settings.clientSecret || integration.apiSecret,

    // Connection method
    connectionType: settings.connectionType || settings.method || 'REST',

    // Field mappings for generic adapter
    fieldMappings: settings.fieldMappings,
    endpoints: settings.endpoints,
    dataPath: settings.dataPath,

    // Custom headers
    customHeaders: settings.customHeaders
  };
}

/**
 * Get adapter metadata for a given type
 */
export function getAdapterMetadata(type) {
  const normalizedType = normalizeAdapterType(type);

  const metadata = {
    [AdapterTypes.SAP]: {
      name: 'SAP Extended Warehouse Management',
      description: 'Connect to SAP EWM via OData Services',
      supportedMethods: ['REST API', 'BAPI', 'IDoc', 'RFC'],
      requiredFields: ['endpoint', 'username', 'password'],
      optionalFields: ['warehouseNumber', 'client', 'apiKey'],
      features: ['Real-time sync', 'Inventory management', 'Task management']
    },
    [AdapterTypes.MANHATTAN]: {
      name: 'Manhattan Associates WMS',
      description: 'Connect to Manhattan WMS via REST API',
      supportedMethods: ['REST API', 'Database', 'EDI'],
      requiredFields: ['endpoint', 'clientId', 'clientSecret'],
      optionalFields: ['facilityId', 'companyId'],
      features: ['Inventory sync', 'Order management', 'Labor tracking']
    },
    [AdapterTypes.BLUE_YONDER]: {
      name: 'Blue Yonder WMS',
      description: 'Connect to Blue Yonder Luminate Platform',
      supportedMethods: ['REST API', 'File Upload', 'Webhook'],
      requiredFields: ['tenantId', 'clientId', 'clientSecret'],
      optionalFields: ['facilityId', 'region', 'environment'],
      features: ['Demand forecasting', 'Labor optimization', 'Inventory control']
    },
    [AdapterTypes.ORACLE]: {
      name: 'Oracle WMS Cloud',
      description: 'Connect to Oracle WMS Cloud via REST APIs',
      supportedMethods: ['REST API', 'Oracle Integration Cloud', 'File Upload'],
      requiredFields: ['endpoint', 'username', 'password'],
      optionalFields: ['organizationId', 'organizationCode'],
      features: ['Inventory visibility', 'Wave planning', 'Shipping integration']
    },
    [AdapterTypes.CUSTOM]: {
      name: 'Custom WMS / Generic Connector',
      description: 'Flexible connector for any WMS system',
      supportedMethods: ['REST API', 'SFTP', 'Database', 'File Upload'],
      requiredFields: ['endpoint'],
      optionalFields: ['apiKey', 'username', 'password', 'fieldMappings'],
      features: ['Custom field mapping', 'Any protocol', 'Flexible authentication']
    }
  };

  return metadata[normalizedType] || metadata[AdapterTypes.CUSTOM];
}

/**
 * Get list of all supported adapter types with metadata
 */
export function getAllAdapterTypes() {
  return [
    { type: AdapterTypes.SAP, ...getAdapterMetadata(AdapterTypes.SAP) },
    { type: AdapterTypes.MANHATTAN, ...getAdapterMetadata(AdapterTypes.MANHATTAN) },
    { type: AdapterTypes.BLUE_YONDER, ...getAdapterMetadata(AdapterTypes.BLUE_YONDER) },
    { type: AdapterTypes.ORACLE, ...getAdapterMetadata(AdapterTypes.ORACLE) },
    { type: AdapterTypes.CUSTOM, ...getAdapterMetadata(AdapterTypes.CUSTOM) }
  ];
}

// Export all adapters and utilities
export {
  BaseWMSAdapter,
  ConnectionStatus,
  DataTypes,
  SAPEWMAdapter,
  ManhattanAdapter,
  BlueYonderAdapter,
  OracleWMSAdapter,
  GenericAdapter
};

export default {
  createAdapter,
  getAdapterMetadata,
  getAllAdapterTypes,
  AdapterTypes,
  ConnectionStatus,
  DataTypes
};
