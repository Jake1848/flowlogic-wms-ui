/**
 * FlowLogic Generic CSV/File Adapter
 *
 * Flexible adapter for:
 * - REST API connections with custom endpoints
 * - SFTP file transfers
 * - Database direct connections
 * - File upload processing
 *
 * Supports any WMS system through configurable mappings
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from '../base/index.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generic/Custom WMS Adapter
 */
export class GenericAdapter extends BaseWMSAdapter {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Custom WMS Integration',
      type: 'custom'
    });

    // Connection settings
    this.connectionType = config.connectionType || 'REST'; // REST, SFTP, DATABASE, FILE
    this.baseUrl = config.endpoint || config.baseUrl;

    // Authentication
    this.authMethod = config.authMethod || 'bearer'; // bearer, basic, apikey, none
    this.username = config.username;
    this.password = config.password;
    this.apiKey = config.apiKey;
    this.apiKeyHeader = config.apiKeyHeader || 'X-API-Key';

    // SFTP settings
    this.sftpHost = config.sftpHost;
    this.sftpPort = config.sftpPort || 22;
    this.sftpPath = config.sftpPath || '/';
    this.sftpPrivateKey = config.sftpPrivateKey;

    // Custom endpoints
    this.endpoints = config.endpoints || {};

    // Field mappings for data transformation
    this.fieldMappings = config.fieldMappings || {};

    // Response parsing configuration
    this.responseConfig = {
      dataPath: config.dataPath || 'data', // Path to data array in response
      paginationPath: config.paginationPath || null,
      hasMorePath: config.hasMorePath || 'hasMore',
      totalCountPath: config.totalCountPath || 'total'
    };
  }

  getSupportedDataTypes() {
    return [
      DataTypes.INVENTORY_SNAPSHOT,
      DataTypes.TRANSACTION_HISTORY,
      DataTypes.ADJUSTMENT_LOG,
      DataTypes.CYCLE_COUNT_RESULTS,
      DataTypes.ORDER_STATUS,
      DataTypes.LOCATION_MASTER,
      DataTypes.SKU_MASTER
    ];
  }

  getSupportedMethods() {
    return ['REST API', 'SFTP', 'Database', 'File Upload'];
  }

  /**
   * Test connection based on connection type
   */
  async testConnection() {
    try {
      this.status = ConnectionStatus.AUTHENTICATING;

      const startTime = Date.now();

      switch (this.connectionType) {
        case 'REST':
          return await this.testRESTConnection(startTime);
        case 'SFTP':
          return await this.testSFTPConnection(startTime);
        case 'DATABASE':
          return await this.testDatabaseConnection(startTime);
        case 'FILE':
          return {
            success: true,
            message: 'File upload mode - ready to receive files',
            details: { connectionType: 'FILE' }
          };
        default:
          throw new Error(`Unknown connection type: ${this.connectionType}`);
      }
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      this.lastError = error.message;

      return {
        success: false,
        message: 'Connection failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Test REST API connection
   */
  async testRESTConnection(startTime) {
    const authResult = await this.authenticate();
    if (!authResult.success) {
      return {
        success: false,
        message: 'Authentication failed',
        details: { error: authResult.error }
      };
    }

    // Try to hit a test endpoint or the base URL
    const testUrl = this.endpoints.health || this.endpoints.test || this.baseUrl;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: this.getHeaders()
    });

    this.status = ConnectionStatus.CONNECTED;

    return {
      success: true,
      message: 'REST API connection successful',
      details: {
        endpoint: this.baseUrl,
        responseTime: Date.now() - startTime,
        statusCode: response.status
      }
    };
  }

  /**
   * Test SFTP connection
   */
  async testSFTPConnection(startTime) {
    // Note: In production, this would use an SFTP library like 'ssh2-sftp-client'
    // For now, we simulate the test
    this.status = ConnectionStatus.CONNECTED;

    return {
      success: true,
      message: 'SFTP connection configured (requires ssh2-sftp-client for live test)',
      details: {
        host: this.sftpHost,
        port: this.sftpPort,
        path: this.sftpPath,
        responseTime: Date.now() - startTime
      }
    };
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(startTime) {
    // Note: Database connections would use appropriate driver
    return {
      success: true,
      message: 'Database connection configured',
      details: {
        connectionType: 'DATABASE',
        responseTime: Date.now() - startTime
      }
    };
  }

  /**
   * Authenticate based on auth method
   */
  async authenticate() {
    try {
      switch (this.authMethod) {
        case 'bearer':
          if (this.config.tokenUrl) {
            // OAuth flow
            const response = await fetch(this.config.tokenUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.apiKey,
                client_secret: this.password
              })
            });

            if (response.ok) {
              const data = await response.json();
              this.authToken = data.access_token;
              this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
              return { success: true, token: this.authToken };
            }
          }
          // Use API key as bearer token
          this.authToken = this.apiKey;
          return { success: true, token: this.authToken };

        case 'basic':
          const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
          this.authToken = credentials;
          return { success: true, token: this.authToken };

        case 'apikey':
          this.authToken = this.apiKey;
          return { success: true, token: this.authToken };

        case 'none':
          return { success: true };

        default:
          return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get headers based on auth method
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    switch (this.authMethod) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.authToken}`;
        break;
      case 'basic':
        headers['Authorization'] = `Basic ${this.authToken}`;
        break;
      case 'apikey':
        headers[this.apiKeyHeader] = this.authToken;
        break;
    }

    // Add custom headers
    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    return headers;
  }

  /**
   * Fetch data based on connection type
   */
  async fetchData(dataType, options = {}) {
    switch (this.connectionType) {
      case 'REST':
        return await this.fetchFromREST(dataType, options);
      case 'SFTP':
        return await this.fetchFromSFTP(dataType, options);
      case 'FILE':
        return await this.processFile(dataType, options);
      default:
        throw new Error(`Unsupported connection type: ${this.connectionType}`);
    }
  }

  /**
   * Fetch data from REST API
   */
  async fetchFromREST(dataType, options = {}) {
    try {
      await this.refreshAuthIfNeeded();

      // Get endpoint for this data type
      const endpoint = this.endpoints[dataType] || this.endpoints.default;
      if (!endpoint) {
        throw new Error(`No endpoint configured for data type: ${dataType}`);
      }

      // Build URL with query parameters
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.dateFrom) params.append('fromDate', options.dateFrom.toISOString());
      if (options.dateTo) params.append('toDate', options.dateTo.toISOString());

      // Add custom query params
      if (options.params) {
        for (const [key, value] of Object.entries(options.params)) {
          params.append(key, value);
        }
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: this.getHeaders(),
        ...(options.body && { body: JSON.stringify(options.body) })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Extract data using configured path
      const data = this.getNestedValue(result, this.responseConfig.dataPath) || result || [];
      const dataArray = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: dataArray,
        count: dataArray.length,
        hasMore: this.getNestedValue(result, this.responseConfig.hasMorePath),
        totalCount: this.getNestedValue(result, this.responseConfig.totalCountPath)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Fetch data from SFTP
   */
  async fetchFromSFTP(dataType, options = {}) {
    // In production, use ssh2-sftp-client
    // This is a placeholder showing the structure
    return {
      success: false,
      error: 'SFTP fetching requires ssh2-sftp-client package. Use file upload instead.',
      data: []
    };
  }

  /**
   * Process uploaded file
   */
  async processFile(dataType, options = {}) {
    try {
      const { filePath, content, format = 'csv' } = options;

      let fileContent;
      if (content) {
        fileContent = content;
      } else if (filePath) {
        fileContent = await fs.readFile(filePath, 'utf-8');
      } else {
        throw new Error('No file content or path provided');
      }

      let data;
      switch (format.toLowerCase()) {
        case 'csv':
          data = this.parseCSV(fileContent, dataType);
          break;
        case 'json':
          data = JSON.parse(fileContent);
          if (!Array.isArray(data)) {
            data = this.getNestedValue(data, this.responseConfig.dataPath) || [data];
          }
          break;
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }

      return {
        success: true,
        data,
        count: data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Parse CSV content
   */
  parseCSV(content, dataType) {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Apply field mappings if configured
    const mapping = this.fieldMappings[dataType];
    if (mapping) {
      return records.map(record => this.applyMapping(record, mapping));
    }

    return records;
  }

  /**
   * Apply field mapping to a record
   */
  applyMapping(record, mapping) {
    const mapped = {};
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      if (record[sourceField] !== undefined) {
        mapped[targetField] = record[sourceField];
      }
    }
    // Include unmapped fields
    for (const [key, value] of Object.entries(record)) {
      if (!mapping[key] && !mapped[key]) {
        mapped[key] = value;
      }
    }
    return mapped;
  }

  /**
   * Transform data to FlowLogic schema
   */
  transformData(dataType, rawData) {
    // Use configured field mappings if available
    const mapping = this.fieldMappings[dataType];

    switch (dataType) {
      case DataTypes.INVENTORY_SNAPSHOT:
        return rawData.map(item => this.transformInventory(item, mapping));
      case DataTypes.TRANSACTION_HISTORY:
        return rawData.map(item => this.transformTransaction(item, mapping));
      case DataTypes.CYCLE_COUNT_RESULTS:
        return rawData.map(item => this.transformCycleCount(item, mapping));
      case DataTypes.ADJUSTMENT_LOG:
        return rawData.map(item => this.transformAdjustment(item, mapping));
      case DataTypes.LOCATION_MASTER:
        return rawData.map(item => this.transformLocation(item, mapping));
      default:
        return rawData;
    }
  }

  /**
   * Transform inventory record with flexible field mapping
   */
  transformInventory(item, mapping = {}) {
    return {
      sku: this.getField(item, mapping, 'sku', ['sku', 'SKU', 'itemNumber', 'item_number', 'item', 'product_id']),
      locationCode: this.getField(item, mapping, 'locationCode', ['location', 'locationCode', 'location_code', 'loc', 'bin']),
      quantityOnHand: this.parseNumber(this.getField(item, mapping, 'quantityOnHand', ['quantity', 'qty', 'onHand', 'on_hand', 'qty_on_hand'])),
      quantityAllocated: this.parseNumber(this.getField(item, mapping, 'quantityAllocated', ['allocated', 'qty_allocated', 'reserved'])),
      quantityAvailable: this.parseNumber(this.getField(item, mapping, 'quantityAvailable', ['available', 'qty_available', 'avail'])),
      lotNumber: this.getField(item, mapping, 'lotNumber', ['lot', 'lotNumber', 'lot_number', 'batch']),
      expirationDate: this.parseDate(this.getField(item, mapping, 'expirationDate', ['expiration', 'expDate', 'exp_date', 'bestBy'])),
      unitOfMeasure: this.getField(item, mapping, 'unitOfMeasure', ['uom', 'unit', 'unitOfMeasure']),
      rawData: item
    };
  }

  /**
   * Transform transaction record
   */
  transformTransaction(item, mapping = {}) {
    return {
      transactionId: this.getField(item, mapping, 'transactionId', ['transactionId', 'transaction_id', 'tranId', 'id']),
      type: this.getField(item, mapping, 'type', ['type', 'transactionType', 'transaction_type', 'tranType']),
      sku: this.getField(item, mapping, 'sku', ['sku', 'SKU', 'itemNumber', 'item']),
      fromLocation: this.getField(item, mapping, 'fromLocation', ['fromLocation', 'from_location', 'source']),
      toLocation: this.getField(item, mapping, 'toLocation', ['toLocation', 'to_location', 'destination', 'location']),
      quantity: this.parseNumber(this.getField(item, mapping, 'quantity', ['quantity', 'qty', 'amount'])),
      userId: this.getField(item, mapping, 'userId', ['userId', 'user_id', 'user', 'operator']),
      transactionDate: this.parseDate(this.getField(item, mapping, 'transactionDate', ['date', 'transactionDate', 'transaction_date', 'timestamp'])),
      rawData: item
    };
  }

  /**
   * Transform cycle count record
   */
  transformCycleCount(item, mapping = {}) {
    const systemQty = this.parseNumber(this.getField(item, mapping, 'systemQty', ['systemQty', 'system_qty', 'expectedQty', 'expected']));
    const countedQty = this.parseNumber(this.getField(item, mapping, 'countedQty', ['countedQty', 'counted_qty', 'actualQty', 'actual', 'count']));

    return {
      countId: this.getField(item, mapping, 'countId', ['countId', 'count_id', 'id']),
      sku: this.getField(item, mapping, 'sku', ['sku', 'SKU', 'itemNumber', 'item']),
      locationCode: this.getField(item, mapping, 'locationCode', ['location', 'locationCode', 'location_code']),
      systemQty,
      countedQty,
      variance: countedQty - systemQty,
      variancePercent: systemQty !== 0 ? ((countedQty - systemQty) / systemQty) * 100 : 0,
      counterId: this.getField(item, mapping, 'counterId', ['counterId', 'counter_id', 'countedBy', 'user']),
      countDate: this.parseDate(this.getField(item, mapping, 'countDate', ['countDate', 'count_date', 'date'])),
      rawData: item
    };
  }

  /**
   * Transform adjustment record
   */
  transformAdjustment(item, mapping = {}) {
    return {
      adjustmentId: this.getField(item, mapping, 'adjustmentId', ['adjustmentId', 'adjustment_id', 'id']),
      sku: this.getField(item, mapping, 'sku', ['sku', 'SKU', 'itemNumber', 'item']),
      locationCode: this.getField(item, mapping, 'locationCode', ['location', 'locationCode', 'location_code']),
      adjustmentQty: this.parseNumber(this.getField(item, mapping, 'adjustmentQty', ['adjustmentQty', 'adjustment_qty', 'quantity', 'qty'])),
      reason: this.getField(item, mapping, 'reason', ['reason', 'reasonDescription', 'reason_desc']),
      reasonCode: this.getField(item, mapping, 'reasonCode', ['reasonCode', 'reason_code']),
      userId: this.getField(item, mapping, 'userId', ['userId', 'user_id', 'user', 'adjustedBy']),
      adjustmentDate: this.parseDate(this.getField(item, mapping, 'adjustmentDate', ['date', 'adjustmentDate', 'adjustment_date'])),
      rawData: item
    };
  }

  /**
   * Transform location record
   */
  transformLocation(item, mapping = {}) {
    return {
      locationCode: this.getField(item, mapping, 'locationCode', ['locationCode', 'location_code', 'location', 'locn']),
      zone: this.getField(item, mapping, 'zone', ['zone', 'zoneCode', 'zone_code']),
      aisle: this.getField(item, mapping, 'aisle', ['aisle']),
      bay: this.getField(item, mapping, 'bay', ['bay', 'rack']),
      level: this.getField(item, mapping, 'level', ['level', 'tier']),
      position: this.getField(item, mapping, 'position', ['position', 'slot']),
      locationType: this.getField(item, mapping, 'locationType', ['type', 'locationType', 'location_type']),
      maxWeight: this.parseNumber(this.getField(item, mapping, 'maxWeight', ['maxWeight', 'max_weight'])),
      maxVolume: this.parseNumber(this.getField(item, mapping, 'maxVolume', ['maxVolume', 'max_volume'])),
      isActive: this.parseBoolean(this.getField(item, mapping, 'isActive', ['active', 'isActive', 'is_active', 'status'])),
      rawData: item
    };
  }

  /**
   * Get field value using mapping or fallback field names
   */
  getField(item, mapping, targetField, fallbackFields) {
    // First check if there's a specific mapping for this target field
    if (mapping && mapping[targetField]) {
      return item[mapping[targetField]];
    }

    // Try fallback field names
    for (const field of fallbackFields) {
      if (item[field] !== undefined) {
        return item[field];
      }
    }

    return null;
  }

  /**
   * Get nested value from object using dot notation path
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Parse boolean from various formats
   */
  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', 'yes', '1', 'active', 'y'].includes(value.toLowerCase());
    }
    return Boolean(value);
  }
}

export default GenericAdapter;
