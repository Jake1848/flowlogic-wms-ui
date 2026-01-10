/**
 * FlowLogic Manhattan Associates WMS Adapter
 *
 * Connects to Manhattan Associates WMS via:
 * - REST API (SCALE / WMOS API)
 * - Database direct connection
 * - EDI integration
 *
 * Supports:
 * - Real-time inventory sync
 * - Order management data
 * - Labor tracking
 * - Task management
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from '../base/index.js';

/**
 * Manhattan API endpoints
 */
const MANHATTAN_ENDPOINTS = {
  // Authentication
  AUTH_TOKEN: '/oauth/token',

  // Inventory APIs
  INVENTORY: '/api/v2/inventory',
  INVENTORY_SNAPSHOT: '/api/v2/inventory/snapshot',
  INVENTORY_BY_LOCATION: '/api/v2/inventory/by-location',
  INVENTORY_BY_ITEM: '/api/v2/inventory/by-item',

  // Location APIs
  LOCATIONS: '/api/v2/locations',
  LOCATION_INVENTORY: '/api/v2/locations/{locationId}/inventory',

  // Transaction APIs
  TRANSACTIONS: '/api/v2/transactions',
  ADJUSTMENTS: '/api/v2/adjustments',

  // Cycle Count APIs
  CYCLE_COUNTS: '/api/v2/cycle-counts',
  CYCLE_COUNT_RESULTS: '/api/v2/cycle-counts/results',

  // Order APIs
  ORDERS: '/api/v2/orders',
  ORDER_LINES: '/api/v2/orders/{orderId}/lines',

  // Task APIs
  TASKS: '/api/v2/tasks',
  TASK_TYPES: '/api/v2/tasks/types',

  // Labor APIs
  LABOR_RECORDS: '/api/v2/labor/records',
  LABOR_PERFORMANCE: '/api/v2/labor/performance'
};

/**
 * Manhattan Associates WMS Adapter
 */
export class ManhattanAdapter extends BaseWMSAdapter {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Manhattan Associates WMS',
      type: 'manhattan'
    });

    this.baseUrl = config.endpoint || config.baseUrl;
    this.clientId = config.clientId || config.apiKey;
    this.clientSecret = config.clientSecret || config.apiSecret;
    this.username = config.username;
    this.password = config.password;
    this.facilityId = config.facilityId || config.settings?.facilityId;
    this.companyId = config.companyId || config.settings?.companyId;

    // Manhattan-specific settings
    this.apiVersion = config.apiVersion || 'v2';
    this.useDirectDB = config.useDirectDB || false;
  }

  getSupportedDataTypes() {
    return [
      DataTypes.INVENTORY_SNAPSHOT,
      DataTypes.TRANSACTION_HISTORY,
      DataTypes.ADJUSTMENT_LOG,
      DataTypes.CYCLE_COUNT_RESULTS,
      DataTypes.ORDER_STATUS,
      DataTypes.LOCATION_MASTER
    ];
  }

  getSupportedMethods() {
    return ['REST API', 'Database', 'EDI'];
  }

  /**
   * Test connection to Manhattan WMS
   */
  async testConnection() {
    try {
      this.status = ConnectionStatus.AUTHENTICATING;

      // First authenticate
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          message: 'Authentication failed',
          details: { error: authResult.error }
        };
      }

      // Test with a simple health check or inventory endpoint
      const startTime = Date.now();
      const testUrl = `${this.baseUrl}/api/health`;

      try {
        const response = await this.makeRequest(testUrl, { method: 'GET' });
        this.status = ConnectionStatus.CONNECTED;

        return {
          success: true,
          message: 'Connection successful',
          details: {
            endpoint: this.baseUrl,
            facilityId: this.facilityId,
            responseTime: Date.now() - startTime,
            serverInfo: 'Manhattan Associates WMS'
          }
        };
      } catch {
        // Health endpoint might not exist, try inventory endpoint
        const inventoryUrl = `${this.baseUrl}${MANHATTAN_ENDPOINTS.INVENTORY}?limit=1`;
        await this.makeRequest(inventoryUrl, { method: 'GET' });

        this.status = ConnectionStatus.CONNECTED;
        return {
          success: true,
          message: 'Connection successful',
          details: {
            endpoint: this.baseUrl,
            facilityId: this.facilityId,
            responseTime: Date.now() - startTime
          }
        };
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
   * Authenticate with Manhattan WMS
   */
  async authenticate() {
    try {
      // OAuth 2.0 client credentials flow
      const tokenUrl = `${this.baseUrl}${MANHATTAN_ENDPOINTS.AUTH_TOKEN}`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          ...(this.username && { username: this.username }),
          ...(this.password && { password: this.password })
        })
      });

      if (!response.ok) {
        // Try basic auth fallback
        if (this.username && this.password) {
          const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
          this.authToken = credentials;
          this.authType = 'Basic';
          return { success: true, token: this.authToken };
        }
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.authToken = data.access_token;
      this.authType = 'Bearer';
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return {
        success: true,
        token: this.authToken,
        expiry: this.tokenExpiry
      };
    } catch (error) {
      // Fallback to API key if provided
      if (this.clientId && !this.clientSecret) {
        this.authToken = this.clientId;
        this.authType = 'ApiKey';
        return { success: true, token: this.authToken };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Get auth headers based on auth type
   */
  getAuthHeaders() {
    const headers = {};

    switch (this.authType) {
      case 'Bearer':
        headers['Authorization'] = `Bearer ${this.authToken}`;
        break;
      case 'Basic':
        headers['Authorization'] = `Basic ${this.authToken}`;
        break;
      case 'ApiKey':
        headers['X-API-Key'] = this.authToken;
        break;
    }

    if (this.facilityId) {
      headers['X-Facility-Id'] = this.facilityId;
    }
    if (this.companyId) {
      headers['X-Company-Id'] = this.companyId;
    }

    return headers;
  }

  /**
   * Fetch data from Manhattan WMS
   */
  async fetchData(dataType, options = {}) {
    try {
      await this.refreshAuthIfNeeded();

      let endpoint;
      const params = new URLSearchParams();

      // Common pagination
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      switch (dataType) {
        case DataTypes.INVENTORY_SNAPSHOT:
          endpoint = MANHATTAN_ENDPOINTS.INVENTORY_SNAPSHOT;
          if (this.facilityId) params.append('facilityId', this.facilityId);
          if (options.itemNumber) params.append('itemNumber', options.itemNumber);
          if (options.locationId) params.append('locationId', options.locationId);
          break;

        case DataTypes.TRANSACTION_HISTORY:
          endpoint = MANHATTAN_ENDPOINTS.TRANSACTIONS;
          if (options.dateFrom) params.append('fromDate', options.dateFrom.toISOString());
          if (options.dateTo) params.append('toDate', options.dateTo.toISOString());
          if (options.transactionType) params.append('transactionType', options.transactionType);
          break;

        case DataTypes.ADJUSTMENT_LOG:
          endpoint = MANHATTAN_ENDPOINTS.ADJUSTMENTS;
          if (options.dateFrom) params.append('fromDate', options.dateFrom.toISOString());
          if (options.dateTo) params.append('toDate', options.dateTo.toISOString());
          break;

        case DataTypes.CYCLE_COUNT_RESULTS:
          endpoint = MANHATTAN_ENDPOINTS.CYCLE_COUNT_RESULTS;
          if (options.countId) params.append('countId', options.countId);
          if (options.dateFrom) params.append('fromDate', options.dateFrom.toISOString());
          break;

        case DataTypes.ORDER_STATUS:
          endpoint = MANHATTAN_ENDPOINTS.ORDERS;
          if (options.status) params.append('status', options.status);
          if (options.dateFrom) params.append('fromDate', options.dateFrom.toISOString());
          break;

        case DataTypes.LOCATION_MASTER:
          endpoint = MANHATTAN_ENDPOINTS.LOCATIONS;
          if (this.facilityId) params.append('facilityId', this.facilityId);
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`Manhattan API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Handle different response formats
      const data = result.data || result.items || result.results || result || [];
      const dataArray = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: dataArray,
        count: dataArray.length,
        hasMore: result.hasMore || result.nextPage !== undefined,
        totalCount: result.totalCount || result.total
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
   * Transform Manhattan data to FlowLogic schema
   */
  transformData(dataType, rawData) {
    switch (dataType) {
      case DataTypes.INVENTORY_SNAPSHOT:
        return this.transformInventory(rawData);
      case DataTypes.TRANSACTION_HISTORY:
        return this.transformTransactions(rawData);
      case DataTypes.CYCLE_COUNT_RESULTS:
        return this.transformCycleCounts(rawData);
      case DataTypes.ADJUSTMENT_LOG:
        return this.transformAdjustments(rawData);
      case DataTypes.LOCATION_MASTER:
        return this.transformLocations(rawData);
      case DataTypes.ORDER_STATUS:
        return this.transformOrders(rawData);
      default:
        return rawData;
    }
  }

  /**
   * Transform Manhattan inventory to FlowLogic schema
   */
  transformInventory(rawData) {
    return rawData.map(item => ({
      sku: item.itemNumber || item.sku || item.SKU,
      locationCode: item.locationId || item.location || item.LOCATION_ID,
      quantityOnHand: this.parseNumber(item.onHandQuantity || item.qtyOnHand || item.QTY_OH),
      quantityAllocated: this.parseNumber(item.allocatedQuantity || item.qtyAllocated || item.QTY_ALLOC),
      quantityAvailable: this.parseNumber(item.availableQuantity || item.qtyAvailable || item.QTY_AVAIL),
      lotNumber: item.lotNumber || item.lot || item.LOT_NBR || null,
      expirationDate: this.parseDate(item.expirationDate || item.expDate || item.EXP_DATE),
      unitOfMeasure: item.unitOfMeasure || item.uom || item.UOM,
      lpnId: item.lpnId || item.licensePlate || item.LPN_ID,
      inventoryStatus: item.inventoryStatus || item.status,
      facilityId: item.facilityId || this.facilityId,
      rawData: item
    }));
  }

  /**
   * Transform Manhattan transactions to FlowLogic schema
   */
  transformTransactions(rawData) {
    return rawData.map(item => ({
      transactionId: item.transactionId || item.tranId || item.TRAN_ID,
      type: this.mapTransactionType(item.transactionType || item.tranType || item.TRAN_TYPE),
      sku: item.itemNumber || item.sku,
      fromLocation: item.fromLocation || item.sourceLocation,
      toLocation: item.toLocation || item.destinationLocation,
      quantity: this.parseNumber(item.quantity || item.qty),
      userId: item.userId || item.user || item.USER_ID,
      transactionDate: this.parseDate(item.transactionDate || item.tranDate || item.TRAN_DATE),
      lpnId: item.lpnId || item.licensePlate,
      orderNumber: item.orderNumber || item.orderId,
      referenceNumber: item.referenceNumber || item.refNum,
      rawData: item
    }));
  }

  /**
   * Transform Manhattan cycle counts to FlowLogic schema
   */
  transformCycleCounts(rawData) {
    return rawData.map(item => ({
      countId: item.countId || item.cycleCountId || item.CC_ID,
      sku: item.itemNumber || item.sku,
      locationCode: item.locationId || item.location,
      systemQty: this.parseNumber(item.systemQuantity || item.sysQty || item.SYS_QTY),
      countedQty: this.parseNumber(item.countedQuantity || item.countQty || item.COUNT_QTY),
      variance: this.parseNumber(item.variance || item.varianceQty),
      variancePercent: this.parseNumber(item.variancePercent || item.varPct),
      counterId: item.counterId || item.countedBy,
      countDate: this.parseDate(item.countDate || item.COUNT_DATE),
      countStatus: item.status || item.countStatus,
      rawData: item
    }));
  }

  /**
   * Transform Manhattan adjustments to FlowLogic schema
   */
  transformAdjustments(rawData) {
    return rawData.map(item => ({
      adjustmentId: item.adjustmentId || item.adjId || item.ADJ_ID,
      sku: item.itemNumber || item.sku,
      locationCode: item.locationId || item.location,
      adjustmentQty: this.parseNumber(item.adjustmentQuantity || item.adjQty || item.ADJ_QTY),
      reason: item.reasonDescription || item.reason || item.REASON_DESC,
      reasonCode: item.reasonCode || item.REASON_CODE,
      userId: item.userId || item.adjustedBy,
      adjustmentDate: this.parseDate(item.adjustmentDate || item.ADJ_DATE),
      rawData: item
    }));
  }

  /**
   * Transform Manhattan locations to FlowLogic schema
   */
  transformLocations(rawData) {
    return rawData.map(item => ({
      locationCode: item.locationId || item.location || item.LOCN_ID,
      locationType: item.locationType || item.type || item.LOCN_TYPE,
      zone: item.zone || item.zoneId || item.ZONE,
      aisle: item.aisle || item.AISLE,
      bay: item.bay || item.BAY,
      level: item.level || item.LEVEL,
      position: item.position || item.POSN,
      maxWeight: this.parseNumber(item.maxWeight || item.MAX_WT),
      maxVolume: this.parseNumber(item.maxVolume || item.MAX_VOL),
      maxPallets: this.parseNumber(item.maxPallets),
      isPickable: item.pickable !== false && item.PICK_FLAG !== 'N',
      isPutawayable: item.putawayable !== false && item.PUT_FLAG !== 'N',
      isActive: item.active !== false && item.STATUS !== 'I',
      facilityId: item.facilityId || this.facilityId,
      rawData: item
    }));
  }

  /**
   * Transform Manhattan orders to FlowLogic schema
   */
  transformOrders(rawData) {
    return rawData.map(item => ({
      orderId: item.orderId || item.orderNumber || item.ORDER_ID,
      orderType: item.orderType || item.type,
      status: item.status || item.orderStatus,
      priority: item.priority,
      customerId: item.customerId || item.customer,
      orderDate: this.parseDate(item.orderDate || item.ORDER_DATE),
      shipDate: this.parseDate(item.shipDate || item.SHIP_DATE),
      totalLines: this.parseNumber(item.totalLines || item.lineCount),
      totalUnits: this.parseNumber(item.totalUnits || item.unitCount),
      completedLines: this.parseNumber(item.completedLines),
      completedUnits: this.parseNumber(item.completedUnits),
      rawData: item
    }));
  }

  /**
   * Map Manhattan transaction types
   */
  mapTransactionType(tranType) {
    const types = {
      'RCV': 'RECEIVE',
      'RECEIVE': 'RECEIVE',
      'PUT': 'PUTAWAY',
      'PUTAWAY': 'PUTAWAY',
      'PCK': 'PICK',
      'PICK': 'PICK',
      'PACK': 'PACK',
      'SHP': 'SHIP',
      'SHIP': 'SHIP',
      'ADJ': 'ADJUSTMENT',
      'ADJUST': 'ADJUSTMENT',
      'MOV': 'MOVE',
      'MOVE': 'MOVE',
      'TRANSFER': 'TRANSFER',
      'CC': 'CYCLE_COUNT',
      'COUNT': 'CYCLE_COUNT',
      'RPL': 'REPLENISH',
      'REPLEN': 'REPLENISH'
    };
    return types[tranType?.toUpperCase()] || tranType;
  }
}

export default ManhattanAdapter;
