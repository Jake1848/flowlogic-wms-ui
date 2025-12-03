/**
 * ERP Integration Module
 * Factory for creating ERP adapters and common utilities
 */

import { BaseERPAdapter } from './base-adapter.js';
import { SAPAdapter } from './sap-adapter.js';
import { OracleAdapter } from './oracle-adapter.js';
import { NetSuiteAdapter } from './netsuite-adapter.js';
import { DynamicsAdapter } from './dynamics-adapter.js';

// Supported ERP systems
export const ERP_SYSTEMS = {
  SAP: {
    name: 'SAP',
    types: ['ECC', 'S4HANA'],
    connectionMethods: ['RFC', 'ODATA', 'IDOC'],
    adapter: SAPAdapter
  },
  ORACLE: {
    name: 'Oracle',
    types: ['FUSION', 'EBS', 'JDE'],
    connectionMethods: ['REST', 'SOAP', 'JDBC'],
    adapter: OracleAdapter
  },
  NETSUITE: {
    name: 'NetSuite',
    types: ['SUITETALK'],
    connectionMethods: ['REST', 'SOAP'],
    adapter: NetSuiteAdapter
  },
  DYNAMICS: {
    name: 'Microsoft Dynamics',
    types: ['F&O', 'BC', 'GP'],
    connectionMethods: ['ODATA', 'REST'],
    adapter: DynamicsAdapter
  }
};

/**
 * Create an ERP adapter instance
 * @param {string} erpType - The ERP system type (SAP, ORACLE, NETSUITE, DYNAMICS)
 * @param {object} config - Configuration for the adapter
 * @returns {BaseERPAdapter} The adapter instance
 */
export function createERPAdapter(erpType, config) {
  const erpSystem = ERP_SYSTEMS[erpType.toUpperCase()];

  if (!erpSystem) {
    throw new Error(`Unknown ERP system: ${erpType}. Supported: ${Object.keys(ERP_SYSTEMS).join(', ')}`);
  }

  return new erpSystem.adapter(config);
}

/**
 * ERP Integration Manager
 * Manages multiple ERP connections and synchronization
 */
export class ERPIntegrationManager {
  constructor() {
    this.adapters = new Map();
    this.syncSchedules = new Map();
  }

  /**
   * Register an ERP adapter
   */
  registerAdapter(name, erpType, config) {
    const adapter = createERPAdapter(erpType, config);
    this.adapters.set(name, {
      adapter,
      erpType,
      config,
      status: 'disconnected'
    });
    return adapter;
  }

  /**
   * Get a registered adapter
   */
  getAdapter(name) {
    const entry = this.adapters.get(name);
    return entry?.adapter;
  }

  /**
   * Connect all registered adapters
   */
  async connectAll() {
    const results = [];

    for (const [name, entry] of this.adapters) {
      try {
        await entry.adapter.connect();
        entry.status = 'connected';
        results.push({ name, status: 'connected' });
      } catch (error) {
        entry.status = 'error';
        results.push({ name, status: 'error', error: error.message });
      }
    }

    return results;
  }

  /**
   * Disconnect all adapters
   */
  async disconnectAll() {
    for (const [name, entry] of this.adapters) {
      try {
        await entry.adapter.disconnect();
        entry.status = 'disconnected';
      } catch (error) {
        console.error(`Error disconnecting ${name}:`, error);
      }
    }
  }

  /**
   * Get status of all adapters
   */
  getStatus() {
    const status = {};
    for (const [name, entry] of this.adapters) {
      status[name] = {
        erpType: entry.erpType,
        status: entry.status,
        ...entry.adapter.getStatus()
      };
    }
    return status;
  }

  /**
   * Schedule periodic sync for an adapter
   */
  scheduleSync(adapterName, syncType, intervalMs, syncFn) {
    const key = `${adapterName}:${syncType}`;

    // Clear existing schedule
    if (this.syncSchedules.has(key)) {
      clearInterval(this.syncSchedules.get(key));
    }

    // Set new schedule
    const intervalId = setInterval(async () => {
      const adapter = this.getAdapter(adapterName);
      if (adapter && adapter.connected) {
        try {
          await syncFn(adapter);
        } catch (error) {
          console.error(`Sync error (${key}):`, error);
        }
      }
    }, intervalMs);

    this.syncSchedules.set(key, intervalId);
    return key;
  }

  /**
   * Cancel a scheduled sync
   */
  cancelSync(scheduleKey) {
    if (this.syncSchedules.has(scheduleKey)) {
      clearInterval(this.syncSchedules.get(scheduleKey));
      this.syncSchedules.delete(scheduleKey);
      return true;
    }
    return false;
  }

  /**
   * Cancel all scheduled syncs
   */
  cancelAllSyncs() {
    for (const [key, intervalId] of this.syncSchedules) {
      clearInterval(intervalId);
    }
    this.syncSchedules.clear();
  }
}

/**
 * Data transformation utilities
 */
export const TransformUtils = {
  /**
   * Map ERP field names to FlowLogic field names
   */
  mapFields(data, fieldMapping) {
    if (Array.isArray(data)) {
      return data.map(item => this.mapFields(item, fieldMapping));
    }

    const result = {};
    for (const [targetField, sourceField] of Object.entries(fieldMapping)) {
      if (typeof sourceField === 'function') {
        result[targetField] = sourceField(data);
      } else if (typeof sourceField === 'string') {
        result[targetField] = this.getNestedValue(data, sourceField);
      } else {
        result[targetField] = sourceField;
      }
    }
    return result;
  },

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  /**
   * Set nested value on object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  },

  /**
   * Convert UOM codes between systems
   */
  convertUOM(uom, fromSystem, toSystem) {
    const uomMap = {
      SAP: { ST: 'EA', PC: 'EA', CS: 'CA', PAL: 'PL', KG: 'KG', LB: 'LB' },
      ORACLE: { Ea: 'EA', Each: 'EA', Case: 'CA', Pallet: 'PL' },
      NETSUITE: { _each: 'EA', _case: 'CA', _pallet: 'PL' },
      DYNAMICS: { ea: 'EA', pcs: 'EA', case: 'CA', plt: 'PL' },
      FLOWLOGIC: { EA: 'EA', CA: 'CA', PL: 'PL', KG: 'KG', LB: 'LB' }
    };

    // First convert to standard
    const fromMap = uomMap[fromSystem.toUpperCase()];
    const standard = fromMap?.[uom] || uom;

    // Then convert to target
    if (toSystem.toUpperCase() === 'FLOWLOGIC') {
      return standard;
    }

    const toMap = uomMap[toSystem.toUpperCase()];
    for (const [key, value] of Object.entries(toMap || {})) {
      if (value === standard) return key;
    }

    return uom;
  },

  /**
   * Parse various date formats
   */
  parseDate(dateValue, format = 'auto') {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;

    if (format === 'SAP' || (format === 'auto' && /^\d{8}$/.test(dateValue))) {
      // YYYYMMDD
      return new Date(`${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`);
    }

    if (format === 'JDE' || (format === 'auto' && /^\d{6,7}$/.test(dateValue))) {
      // Julian date CYYDDD
      const num = parseInt(dateValue);
      const century = Math.floor(num / 100000);
      const yy = Math.floor((num % 100000) / 1000);
      const ddd = num % 1000;
      const year = (century === 1 ? 2000 : 1900) + yy;
      return new Date(year, 0, ddd);
    }

    return new Date(dateValue);
  },

  /**
   * Format date for specific ERP system
   */
  formatDate(date, format) {
    if (!date) return '';
    const d = new Date(date);

    switch (format) {
      case 'SAP':
        return d.toISOString().slice(0, 10).replace(/-/g, '');
      case 'ODATA':
        return d.toISOString();
      case 'JDE':
        const century = d.getFullYear() >= 2000 ? 1 : 0;
        const yy = d.getFullYear() % 100;
        const start = new Date(d.getFullYear(), 0, 0);
        const ddd = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        return (century * 100000 + yy * 1000 + ddd).toString();
      default:
        return d.toISOString().slice(0, 10);
    }
  }
};

// Export adapters
export {
  BaseERPAdapter,
  SAPAdapter,
  OracleAdapter,
  NetSuiteAdapter,
  DynamicsAdapter
};

// Export singleton manager instance
export const erpManager = new ERPIntegrationManager();
