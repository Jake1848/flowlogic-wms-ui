/**
 * FlowLogic Blue Yonder (JDA) WMS Adapter
 *
 * Connects to Blue Yonder WMS via:
 * - Luminate Platform REST API
 * - File-based integration (SFTP)
 * - Real-time webhooks
 *
 * Supports:
 * - Demand forecasting data
 * - Labor optimization metrics
 * - Inventory control
 * - Order management
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from '../base/index.js';

/**
 * Blue Yonder API endpoints (Luminate Platform)
 */
const BY_ENDPOINTS = {
  // Authentication
  AUTH_TOKEN: '/auth/oauth2/token',
  AUTH_REFRESH: '/auth/oauth2/refresh',

  // Inventory Management
  INVENTORY: '/inventory/v1/inventory-positions',
  INVENTORY_ADJUSTMENTS: '/inventory/v1/inventory-adjustments',
  INVENTORY_COUNTS: '/inventory/v1/inventory-counts',

  // Warehouse Management
  LOCATIONS: '/warehouse/v1/locations',
  STORAGE_AREAS: '/warehouse/v1/storage-areas',
  ZONES: '/warehouse/v1/zones',

  // Order Management
  ORDERS: '/order/v1/orders',
  ORDER_LINES: '/order/v1/order-lines',
  SHIPMENTS: '/order/v1/shipments',

  // Labor Management
  LABOR_STANDARDS: '/labor/v1/standards',
  LABOR_PERFORMANCE: '/labor/v1/performance',
  LABOR_TASKS: '/labor/v1/tasks',

  // Demand/Forecasting
  DEMAND_FORECASTS: '/demand/v1/forecasts',
  DEMAND_HISTORY: '/demand/v1/history',

  // Analytics
  ANALYTICS_INVENTORY: '/analytics/v1/inventory-metrics',
  ANALYTICS_LABOR: '/analytics/v1/labor-metrics',
  ANALYTICS_ORDER: '/analytics/v1/order-metrics'
};

/**
 * Blue Yonder WMS Adapter
 */
export class BlueYonderAdapter extends BaseWMSAdapter {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Blue Yonder WMS',
      type: 'blue-yonder'
    });

    this.baseUrl = config.endpoint || config.baseUrl || 'https://api.blueyonder.com';
    this.tenantId = config.tenantId || config.settings?.tenantId;
    this.clientId = config.clientId || config.apiKey;
    this.clientSecret = config.clientSecret || config.apiSecret;
    this.scope = config.scope || 'inventory orders labor analytics';
    this.facilityId = config.facilityId || config.settings?.facilityId;

    // Blue Yonder specific settings
    this.region = config.region || 'us'; // us, eu, apac
    this.environment = config.environment || 'production'; // sandbox, production
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
    return ['REST API', 'File Upload', 'Webhook'];
  }

  /**
   * Get the correct base URL based on region/environment
   */
  getBaseUrl() {
    if (this.baseUrl) return this.baseUrl;

    const regionUrls = {
      'us-sandbox': 'https://api.sandbox.us.blueyonder.com',
      'us-production': 'https://api.us.blueyonder.com',
      'eu-sandbox': 'https://api.sandbox.eu.blueyonder.com',
      'eu-production': 'https://api.eu.blueyonder.com',
      'apac-sandbox': 'https://api.sandbox.apac.blueyonder.com',
      'apac-production': 'https://api.apac.blueyonder.com'
    };

    return regionUrls[`${this.region}-${this.environment}`] || regionUrls['us-production'];
  }

  /**
   * Test connection to Blue Yonder
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

      // Test with inventory endpoint
      const startTime = Date.now();
      const testUrl = `${this.getBaseUrl()}${BY_ENDPOINTS.INVENTORY}?limit=1`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json',
          'X-Tenant-Id': this.tenantId
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      this.status = ConnectionStatus.CONNECTED;

      return {
        success: true,
        message: 'Connection successful',
        details: {
          endpoint: this.getBaseUrl(),
          tenantId: this.tenantId,
          facilityId: this.facilityId,
          responseTime: Date.now() - startTime,
          region: this.region,
          environment: this.environment
        }
      };
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
   * Authenticate with Blue Yonder
   */
  async authenticate() {
    try {
      const tokenUrl = `${this.getBaseUrl()}${BY_ENDPOINTS.AUTH_TOKEN}`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.scope
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error_description || `Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.authToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return {
        success: true,
        token: this.authToken,
        expiry: this.tokenExpiry
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth() {
    if (!this.refreshToken) {
      return this.authenticate();
    }

    try {
      const tokenUrl = `${this.getBaseUrl()}${BY_ENDPOINTS.AUTH_REFRESH}`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId
        })
      });

      if (!response.ok) {
        // Refresh failed, try full auth
        return this.authenticate();
      }

      const data = await response.json();
      this.authToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return {
        success: true,
        token: this.authToken,
        expiry: this.tokenExpiry
      };
    } catch (error) {
      return this.authenticate();
    }
  }

  /**
   * Get common headers for API requests
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId,
      ...(this.facilityId && { 'X-Facility-Id': this.facilityId })
    };
  }

  /**
   * Fetch data from Blue Yonder
   */
  async fetchData(dataType, options = {}) {
    try {
      await this.refreshAuthIfNeeded();

      let endpoint;
      const params = new URLSearchParams();

      // Common pagination
      params.append('limit', options.limit || 1000);
      if (options.offset) params.append('offset', options.offset);

      switch (dataType) {
        case DataTypes.INVENTORY_SNAPSHOT:
          endpoint = BY_ENDPOINTS.INVENTORY;
          if (this.facilityId) params.append('facilityId', this.facilityId);
          if (options.sku) params.append('itemId', options.sku);
          if (options.locationId) params.append('locationId', options.locationId);
          break;

        case DataTypes.TRANSACTION_HISTORY:
          endpoint = BY_ENDPOINTS.INVENTORY_ADJUSTMENTS;
          if (options.dateFrom) params.append('fromDateTime', options.dateFrom.toISOString());
          if (options.dateTo) params.append('toDateTime', options.dateTo.toISOString());
          break;

        case DataTypes.ADJUSTMENT_LOG:
          endpoint = BY_ENDPOINTS.INVENTORY_ADJUSTMENTS;
          params.append('adjustmentType', 'INVENTORY_ADJUSTMENT');
          if (options.dateFrom) params.append('fromDateTime', options.dateFrom.toISOString());
          break;

        case DataTypes.CYCLE_COUNT_RESULTS:
          endpoint = BY_ENDPOINTS.INVENTORY_COUNTS;
          if (options.countId) params.append('countId', options.countId);
          if (options.dateFrom) params.append('fromDateTime', options.dateFrom.toISOString());
          break;

        case DataTypes.ORDER_STATUS:
          endpoint = BY_ENDPOINTS.ORDERS;
          if (options.status) params.append('status', options.status);
          if (options.dateFrom) params.append('fromDateTime', options.dateFrom.toISOString());
          break;

        case DataTypes.LOCATION_MASTER:
          endpoint = BY_ENDPOINTS.LOCATIONS;
          if (this.facilityId) params.append('facilityId', this.facilityId);
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      const url = `${this.getBaseUrl()}${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `API error: ${response.status}`);
      }

      const result = await response.json();

      // Handle Blue Yonder response format
      const data = result.data || result.items || result.content || result || [];
      const dataArray = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: dataArray,
        count: dataArray.length,
        hasMore: result.hasMore || result.nextPageToken !== undefined,
        totalCount: result.totalElements || result.total
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
   * Transform Blue Yonder data to FlowLogic schema
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
   * Transform Blue Yonder inventory to FlowLogic schema
   */
  transformInventory(rawData) {
    return rawData.map(item => ({
      sku: item.itemId || item.productId || item.sku,
      locationCode: item.locationId || item.binId || item.slotId,
      quantityOnHand: this.parseNumber(item.onHandQuantity || item.quantityOnHand),
      quantityAllocated: this.parseNumber(item.allocatedQuantity || item.reservedQuantity),
      quantityAvailable: this.parseNumber(item.availableQuantity || item.availableToPromise),
      lotNumber: item.lotNumber || item.batchNumber || null,
      expirationDate: this.parseDate(item.expirationDate || item.bestByDate),
      unitOfMeasure: item.unitOfMeasure || item.uom,
      inventoryStatus: item.inventoryStatus || item.status,
      facilityId: item.facilityId || this.facilityId,
      lpnId: item.containerLpn || item.lpn,
      rawData: item
    }));
  }

  /**
   * Transform Blue Yonder transactions to FlowLogic schema
   */
  transformTransactions(rawData) {
    return rawData.map(item => ({
      transactionId: item.transactionId || item.adjustmentId,
      type: this.mapTransactionType(item.transactionType || item.adjustmentType),
      sku: item.itemId || item.productId,
      fromLocation: item.fromLocationId || item.sourceLocation,
      toLocation: item.toLocationId || item.destinationLocation,
      quantity: this.parseNumber(item.quantity || item.adjustmentQuantity),
      userId: item.userId || item.performedBy,
      transactionDate: this.parseDate(item.transactionDateTime || item.adjustmentDateTime),
      referenceNumber: item.referenceNumber || item.documentNumber,
      rawData: item
    }));
  }

  /**
   * Transform Blue Yonder cycle counts to FlowLogic schema
   */
  transformCycleCounts(rawData) {
    return rawData.map(item => ({
      countId: item.countId || item.inventoryCountId,
      sku: item.itemId || item.productId,
      locationCode: item.locationId || item.binId,
      systemQty: this.parseNumber(item.expectedQuantity || item.systemQuantity),
      countedQty: this.parseNumber(item.countedQuantity || item.actualQuantity),
      variance: this.parseNumber(item.varianceQuantity || (item.countedQuantity - item.expectedQuantity)),
      variancePercent: this.parseNumber(item.variancePercentage),
      counterId: item.countedBy || item.userId,
      countDate: this.parseDate(item.countDateTime || item.countDate),
      countStatus: item.status || item.countStatus,
      rawData: item
    }));
  }

  /**
   * Transform Blue Yonder adjustments to FlowLogic schema
   */
  transformAdjustments(rawData) {
    return rawData.map(item => ({
      adjustmentId: item.adjustmentId || item.transactionId,
      sku: item.itemId || item.productId,
      locationCode: item.locationId || item.binId,
      adjustmentQty: this.parseNumber(item.adjustmentQuantity || item.quantity),
      reason: item.reasonDescription || item.adjustmentReason,
      reasonCode: item.reasonCode,
      userId: item.performedBy || item.userId,
      adjustmentDate: this.parseDate(item.adjustmentDateTime),
      rawData: item
    }));
  }

  /**
   * Transform Blue Yonder locations to FlowLogic schema
   */
  transformLocations(rawData) {
    return rawData.map(item => ({
      locationCode: item.locationId || item.binId || item.slotId,
      locationType: item.locationType || item.binType,
      zone: item.zoneId || item.zone,
      aisle: item.aisle,
      level: item.level || item.tier,
      position: item.position || item.slot,
      maxWeight: this.parseNumber(item.maxWeight),
      maxVolume: this.parseNumber(item.maxVolume),
      isPickable: item.isPickable !== false,
      isPutawayable: item.isPutawayable !== false,
      isActive: item.status === 'ACTIVE',
      facilityId: item.facilityId || this.facilityId,
      rawData: item
    }));
  }

  /**
   * Transform Blue Yonder orders to FlowLogic schema
   */
  transformOrders(rawData) {
    return rawData.map(item => ({
      orderId: item.orderId || item.orderNumber,
      orderType: item.orderType,
      status: item.status || item.orderStatus,
      priority: this.parseNumber(item.priority),
      customerId: item.customerId || item.shipToId,
      orderDate: this.parseDate(item.orderDateTime || item.createdDateTime),
      shipDate: this.parseDate(item.shipDateTime || item.requiredDeliveryDate),
      totalLines: this.parseNumber(item.totalLines || item.lineCount),
      totalUnits: this.parseNumber(item.totalQuantity || item.totalUnits),
      rawData: item
    }));
  }

  /**
   * Map Blue Yonder transaction types
   */
  mapTransactionType(tranType) {
    const types = {
      'RECEIPT': 'RECEIVE',
      'RECEIVING': 'RECEIVE',
      'PUTAWAY': 'PUTAWAY',
      'PICK': 'PICK',
      'PICKING': 'PICK',
      'PACK': 'PACK',
      'PACKING': 'PACK',
      'SHIP': 'SHIP',
      'SHIPPING': 'SHIP',
      'INVENTORY_ADJUSTMENT': 'ADJUSTMENT',
      'ADJUSTMENT': 'ADJUSTMENT',
      'TRANSFER': 'TRANSFER',
      'MOVE': 'MOVE',
      'CYCLE_COUNT': 'CYCLE_COUNT',
      'REPLENISHMENT': 'REPLENISH'
    };
    return types[tranType?.toUpperCase()] || tranType;
  }
}

export default BlueYonderAdapter;
