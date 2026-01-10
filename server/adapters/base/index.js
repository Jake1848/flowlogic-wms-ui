/**
 * FlowLogic WMS Base Adapter
 *
 * Abstract base class for all WMS connectors.
 * Provides common functionality for authentication, data fetching,
 * transformation, and error handling.
 */

/**
 * Connection status enum
 */
export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  SYNCING: 'syncing',
  AUTHENTICATING: 'authenticating'
};

/**
 * Data types that can be synced from WMS systems
 */
export const DataTypes = {
  INVENTORY_SNAPSHOT: 'inventory_snapshot',
  TRANSACTION_HISTORY: 'transaction_history',
  ADJUSTMENT_LOG: 'adjustment_log',
  CYCLE_COUNT_RESULTS: 'cycle_count_results',
  ORDER_STATUS: 'order_status',
  LOCATION_MASTER: 'location_master',
  SKU_MASTER: 'sku_master'
};

/**
 * Base WMS Adapter Class
 * All WMS-specific adapters should extend this class
 */
export class BaseWMSAdapter {
  constructor(config) {
    this.config = config;
    this.name = config.name || 'Unknown WMS';
    this.type = config.type || 'custom';
    this.status = ConnectionStatus.DISCONNECTED;
    this.lastSync = null;
    this.lastError = null;
    this.authToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get adapter metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.type,
      supportedDataTypes: this.getSupportedDataTypes(),
      supportedMethods: this.getSupportedMethods(),
      status: this.status,
      lastSync: this.lastSync,
      lastError: this.lastError
    };
  }

  /**
   * Override in subclass: Return supported data types
   */
  getSupportedDataTypes() {
    return [DataTypes.INVENTORY_SNAPSHOT];
  }

  /**
   * Override in subclass: Return supported connection methods
   */
  getSupportedMethods() {
    return ['REST API'];
  }

  /**
   * Test connection to the WMS
   * @returns {Promise<{success: boolean, message: string, details: object}>}
   */
  async testConnection() {
    throw new Error('testConnection must be implemented by subclass');
  }

  /**
   * Authenticate with the WMS
   * @returns {Promise<{success: boolean, token?: string, expiry?: Date}>}
   */
  async authenticate() {
    throw new Error('authenticate must be implemented by subclass');
  }

  /**
   * Refresh authentication token if expired
   */
  async refreshAuthIfNeeded() {
    if (!this.authToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      const result = await this.authenticate();
      if (result.success) {
        this.authToken = result.token;
        this.tokenExpiry = result.expiry;
      }
      return result.success;
    }
    return true;
  }

  /**
   * Fetch data from WMS
   * @param {string} dataType - Type of data to fetch
   * @param {object} options - Fetch options (dateRange, filters, etc.)
   * @returns {Promise<{success: boolean, data: array, count: number}>}
   */
  async fetchData(dataType, options = {}) {
    throw new Error('fetchData must be implemented by subclass');
  }

  /**
   * Transform raw WMS data to FlowLogic schema
   * @param {string} dataType - Type of data
   * @param {array} rawData - Raw data from WMS
   * @returns {array} Transformed data
   */
  transformData(dataType, rawData) {
    throw new Error('transformData must be implemented by subclass');
  }

  /**
   * Full sync operation: fetch, transform, and return data
   * @param {string} dataType - Type of data to sync
   * @param {object} options - Sync options
   */
  async sync(dataType, options = {}) {
    try {
      this.status = ConnectionStatus.SYNCING;

      // Ensure authenticated
      const authSuccess = await this.refreshAuthIfNeeded();
      if (!authSuccess) {
        throw new Error('Authentication failed');
      }

      // Fetch raw data
      const fetchResult = await this.fetchData(dataType, options);
      if (!fetchResult.success) {
        throw new Error(fetchResult.error || 'Failed to fetch data');
      }

      // Transform data
      const transformedData = this.transformData(dataType, fetchResult.data);

      this.status = ConnectionStatus.CONNECTED;
      this.lastSync = new Date();
      this.lastError = null;

      return {
        success: true,
        dataType,
        rawCount: fetchResult.data.length,
        transformedCount: transformedData.length,
        data: transformedData,
        syncTime: this.lastSync
      };
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      this.lastError = error.message;

      return {
        success: false,
        error: error.message,
        dataType
      };
    }
  }

  /**
   * Disconnect from WMS
   */
  async disconnect() {
    this.authToken = null;
    this.tokenExpiry = null;
    this.status = ConnectionStatus.DISCONNECTED;
  }

  /**
   * Helper: Make HTTP request with retry logic
   */
  async makeRequest(url, options = {}, retries = 3) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers
      },
      timeout: options.timeout || 30000
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

        const response = await fetch(url, {
          ...options,
          headers: defaultOptions.headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Helper: Parse date from various formats
   */
  parseDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;

    // Try ISO format
    const isoDate = new Date(dateValue);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try common formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/,  // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/    // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = String(dateValue).match(format);
      if (match) {
        return new Date(dateValue);
      }
    }

    return null;
  }

  /**
   * Helper: Parse numeric value safely
   */
  parseNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
}

export default BaseWMSAdapter;
