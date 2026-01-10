/**
 * FlowLogic Oracle WMS Cloud Adapter
 *
 * Connects to Oracle WMS Cloud via:
 * - Oracle REST APIs
 * - Oracle Integration Cloud (OIC)
 * - File-based integration
 *
 * Supports:
 * - Inventory visibility
 * - Wave planning data
 * - Order management
 * - Shipping integration
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from '../base/index.js';

/**
 * Oracle WMS Cloud API endpoints
 */
const ORACLE_ENDPOINTS = {
  // Inventory Management
  INVENTORY: '/fscmRestApi/resources/latest/inventoryOnHand',
  INVENTORY_TRANSACTIONS: '/fscmRestApi/resources/latest/inventoryTransactions',
  INVENTORY_ADJUSTMENTS: '/fscmRestApi/resources/latest/inventoryAdjustments',

  // Warehouse Management
  LOCATIONS: '/fscmRestApi/resources/latest/warehouseLocations',
  SUBINVENTORIES: '/fscmRestApi/resources/latest/subinventories',
  LOCATORS: '/fscmRestApi/resources/latest/locators',

  // Receiving
  RECEIPTS: '/fscmRestApi/resources/latest/receivingReceiptHeaders',
  RECEIPT_LINES: '/fscmRestApi/resources/latest/receivingReceiptLines',

  // Shipping
  SHIPMENTS: '/fscmRestApi/resources/latest/shipmentHeaders',
  SHIPMENT_LINES: '/fscmRestApi/resources/latest/shipmentLines',

  // Orders
  SALES_ORDERS: '/fscmRestApi/resources/latest/salesOrdersForOrderHub',
  TRANSFER_ORDERS: '/fscmRestApi/resources/latest/supplyChainTransferOrders',

  // Cycle Counting
  CYCLE_COUNTS: '/fscmRestApi/resources/latest/physicalInventoryCounts',
  CYCLE_COUNT_ENTRIES: '/fscmRestApi/resources/latest/physicalInventoryCountEntries',

  // Items
  ITEMS: '/fscmRestApi/resources/latest/itemsV2',

  // Organizations
  ORGANIZATIONS: '/fscmRestApi/resources/latest/inventoryOrganizations'
};

/**
 * Oracle WMS Cloud Adapter
 */
export class OracleWMSAdapter extends BaseWMSAdapter {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Oracle WMS Cloud',
      type: 'oracle-wms'
    });

    this.baseUrl = config.endpoint || config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.clientId = config.clientId || config.apiKey;
    this.clientSecret = config.clientSecret || config.apiSecret;
    this.organizationId = config.organizationId || config.settings?.organizationId;
    this.organizationCode = config.organizationCode || config.settings?.organizationCode;

    // Oracle-specific settings
    this.useOAuth = config.useOAuth !== false;
    this.identityDomain = config.identityDomain;
    this.cloudInstance = config.cloudInstance; // e.g., 'fa-1234'
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
    return ['REST API', 'Oracle Integration Cloud', 'File Upload'];
  }

  /**
   * Get the cloud URL based on instance
   */
  getCloudUrl() {
    if (this.baseUrl) return this.baseUrl;
    if (this.cloudInstance) {
      return `https://${this.cloudInstance}.fa.ocs.oraclecloud.com`;
    }
    return this.baseUrl;
  }

  /**
   * Test connection to Oracle WMS Cloud
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

      // Test with organizations endpoint
      const startTime = Date.now();
      const testUrl = `${this.getCloudUrl()}${ORACLE_ENDPOINTS.ORGANIZATIONS}?limit=1`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      this.status = ConnectionStatus.CONNECTED;

      return {
        success: true,
        message: 'Connection successful',
        details: {
          endpoint: this.getCloudUrl(),
          organizationId: this.organizationId,
          organizationCode: this.organizationCode,
          responseTime: Date.now() - startTime,
          serverInfo: 'Oracle WMS Cloud'
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
   * Authenticate with Oracle Cloud
   */
  async authenticate() {
    try {
      if (this.useOAuth && this.clientId && this.clientSecret) {
        // OAuth 2.0 client credentials flow
        const tokenUrl = `https://idcs-${this.identityDomain}.identity.oraclecloud.com/oauth2/v1/token`;

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'urn:opc:resource:fa:atp'
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.authToken = data.access_token;
          this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
          this.authType = 'Bearer';
          return { success: true, token: this.authToken, expiry: this.tokenExpiry };
        }
      }

      // Fall back to Basic Auth
      if (this.username && this.password) {
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        this.authToken = credentials;
        this.authType = 'Basic';
        return { success: true, token: this.authToken };
      }

      throw new Error('No valid authentication credentials provided');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (this.authType === 'Bearer') {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      headers['Authorization'] = `Basic ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Fetch data from Oracle WMS Cloud
   */
  async fetchData(dataType, options = {}) {
    try {
      await this.refreshAuthIfNeeded();

      let endpoint;
      const params = new URLSearchParams();

      // Oracle uses 'limit' and 'offset' for pagination
      params.append('limit', options.limit || 500);
      if (options.offset) params.append('offset', options.offset);

      // Build query filters
      let filters = [];

      switch (dataType) {
        case DataTypes.INVENTORY_SNAPSHOT:
          endpoint = ORACLE_ENDPOINTS.INVENTORY;
          if (this.organizationId) {
            filters.push(`OrganizationId=${this.organizationId}`);
          }
          if (options.itemNumber) {
            filters.push(`ItemNumber=${options.itemNumber}`);
          }
          break;

        case DataTypes.TRANSACTION_HISTORY:
          endpoint = ORACLE_ENDPOINTS.INVENTORY_TRANSACTIONS;
          if (this.organizationId) {
            filters.push(`OrganizationId=${this.organizationId}`);
          }
          if (options.dateFrom) {
            filters.push(`TransactionDate>=${options.dateFrom.toISOString().split('T')[0]}`);
          }
          break;

        case DataTypes.ADJUSTMENT_LOG:
          endpoint = ORACLE_ENDPOINTS.INVENTORY_ADJUSTMENTS;
          if (this.organizationId) {
            filters.push(`OrganizationId=${this.organizationId}`);
          }
          if (options.dateFrom) {
            filters.push(`AdjustmentDate>=${options.dateFrom.toISOString().split('T')[0]}`);
          }
          break;

        case DataTypes.CYCLE_COUNT_RESULTS:
          endpoint = ORACLE_ENDPOINTS.CYCLE_COUNT_ENTRIES;
          if (options.countId) {
            filters.push(`CountHeaderId=${options.countId}`);
          }
          break;

        case DataTypes.ORDER_STATUS:
          endpoint = ORACLE_ENDPOINTS.SALES_ORDERS;
          if (options.status) {
            filters.push(`StatusCode=${options.status}`);
          }
          break;

        case DataTypes.LOCATION_MASTER:
          endpoint = ORACLE_ENDPOINTS.LOCATORS;
          if (this.organizationId) {
            filters.push(`OrganizationId=${this.organizationId}`);
          }
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      // Add filters to params
      if (filters.length > 0) {
        params.append('q', filters.join(';'));
      }

      const url = `${this.getCloudUrl()}${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.title || `API error: ${response.status}`);
      }

      const result = await response.json();

      // Oracle REST returns items in 'items' array
      const data = result.items || result || [];
      const dataArray = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: dataArray,
        count: dataArray.length,
        hasMore: result.hasMore === true,
        totalCount: result.totalResults || result.count
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
   * Transform Oracle data to FlowLogic schema
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
   * Transform Oracle inventory to FlowLogic schema
   */
  transformInventory(rawData) {
    return rawData.map(item => ({
      sku: item.ItemNumber || item.ItemName,
      locationCode: item.LocatorCode || item.Locator || item.SubinventoryCode,
      quantityOnHand: this.parseNumber(item.OnhandQuantity || item.QuantityOnhand),
      quantityAllocated: this.parseNumber(item.ReservedQuantity || item.AllocatedQuantity),
      quantityAvailable: this.parseNumber(item.AvailableQuantity || item.AvailableToTransact),
      lotNumber: item.LotNumber || null,
      expirationDate: this.parseDate(item.ExpirationDate),
      serialNumber: item.SerialNumber || null,
      unitOfMeasure: item.PrimaryUomCode || item.UOMCode,
      subinventory: item.SubinventoryCode,
      organization: item.OrganizationCode || item.OrganizationName,
      organizationId: item.OrganizationId,
      rawData: item
    }));
  }

  /**
   * Transform Oracle transactions to FlowLogic schema
   */
  transformTransactions(rawData) {
    return rawData.map(item => ({
      transactionId: item.TransactionId || item.TransactionNumber,
      type: this.mapTransactionType(item.TransactionTypeName || item.TransactionTypeId),
      sku: item.ItemNumber,
      fromLocation: item.TransferLocatorCode || item.FromLocatorCode,
      toLocation: item.LocatorCode || item.ToLocatorCode,
      quantity: this.parseNumber(item.TransactionQuantity || item.PrimaryQuantity),
      userId: item.CreatedBy || item.LastUpdatedBy,
      transactionDate: this.parseDate(item.TransactionDate),
      subinventoryFrom: item.TransferSubinventoryCode,
      subinventoryTo: item.SubinventoryCode,
      reasonCode: item.TransactionReasonName || item.ReasonCode,
      sourceDocumentNumber: item.SourceDocumentNumber,
      rawData: item
    }));
  }

  /**
   * Transform Oracle cycle counts to FlowLogic schema
   */
  transformCycleCounts(rawData) {
    return rawData.map(item => ({
      countId: item.CountEntryId || item.CountHeaderId,
      sku: item.ItemNumber,
      locationCode: item.LocatorCode || item.LocatorId,
      systemQty: this.parseNumber(item.SystemQuantity),
      countedQty: this.parseNumber(item.CountQuantity || item.EnteredQuantity),
      variance: this.parseNumber(item.AdjustmentQuantity),
      variancePercent: item.SystemQuantity ?
        (this.parseNumber(item.AdjustmentQuantity) / this.parseNumber(item.SystemQuantity)) * 100 : 0,
      counterId: item.CountedBy || item.CreatedBy,
      countDate: this.parseDate(item.CountDate || item.CreationDate),
      countStatus: item.CountStatus || item.ApprovalStatus,
      lotNumber: item.LotNumber,
      serialNumber: item.SerialNumber,
      rawData: item
    }));
  }

  /**
   * Transform Oracle adjustments to FlowLogic schema
   */
  transformAdjustments(rawData) {
    return rawData.map(item => ({
      adjustmentId: item.AdjustmentId || item.TransactionId,
      sku: item.ItemNumber,
      locationCode: item.LocatorCode || item.Locator,
      adjustmentQty: this.parseNumber(item.AdjustmentQuantity || item.TransactionQuantity),
      reason: item.TransactionReasonName || item.ReasonName,
      reasonCode: item.ReasonCode || item.TransactionReasonId,
      userId: item.CreatedBy,
      adjustmentDate: this.parseDate(item.AdjustmentDate || item.TransactionDate),
      subinventory: item.SubinventoryCode,
      rawData: item
    }));
  }

  /**
   * Transform Oracle locations to FlowLogic schema
   */
  transformLocations(rawData) {
    return rawData.map(item => ({
      locationCode: item.LocatorCode || item.LocatorName,
      locatorId: item.LocatorId,
      subinventory: item.SubinventoryCode,
      description: item.Description,
      locatorType: item.InventoryLocatorType,
      zone: item.ZoneCode || item.Zone,
      aisle: item.Aisle || this.extractAisle(item.LocatorCode),
      rack: item.Rack,
      bin: item.Bin,
      maxWeight: this.parseNumber(item.MaximumWeight),
      maxVolume: this.parseNumber(item.MaximumCubicArea),
      maxUnits: this.parseNumber(item.MaximumUnits),
      isActive: item.DisableDate === null && item.StatusId !== 2,
      pickingOrder: this.parseNumber(item.PickingOrder),
      organizationId: item.OrganizationId,
      rawData: item
    }));
  }

  /**
   * Transform Oracle orders to FlowLogic schema
   */
  transformOrders(rawData) {
    return rawData.map(item => ({
      orderId: item.OrderNumber || item.HeaderId,
      orderType: item.OrderTypeCode || item.OrderType,
      status: item.StatusCode || item.OrderStatus,
      customerId: item.SoldToPartyId || item.CustomerId,
      customerName: item.SoldToPartyName || item.CustomerName,
      orderDate: this.parseDate(item.OrderedDate || item.CreationDate),
      requestedShipDate: this.parseDate(item.RequestedShipDate),
      scheduledShipDate: this.parseDate(item.ScheduledShipDate),
      totalLines: this.parseNumber(item.TotalLines),
      totalAmount: this.parseNumber(item.TotalAmount),
      currency: item.TransactionalCurrencyCode,
      warehouse: item.WarehouseCode || item.ShipFromOrganizationCode,
      rawData: item
    }));
  }

  /**
   * Extract aisle from locator code (e.g., "A01-01-01" -> "A01")
   */
  extractAisle(locatorCode) {
    if (!locatorCode) return null;
    const parts = locatorCode.split(/[-_.]/);
    return parts[0] || null;
  }

  /**
   * Map Oracle transaction types
   */
  mapTransactionType(tranType) {
    const types = {
      'Miscellaneous receipt': 'RECEIPT',
      'Miscellaneous issue': 'ISSUE',
      'Subinventory Transfer': 'TRANSFER',
      'Direct Transfer': 'TRANSFER',
      'Inter-org Transfer': 'TRANSFER',
      'Cycle Count Adjustment': 'CYCLE_COUNT',
      'Physical Inventory Adjustment': 'ADJUSTMENT',
      'Account alias issue': 'ISSUE',
      'Account alias receipt': 'RECEIPT',
      'WIP Completion': 'PRODUCTION',
      'WIP Return': 'PRODUCTION_RETURN',
      'Sales Order Pick': 'PICK',
      'Sales Order Issue': 'SHIP',
      'PO Receipt': 'RECEIVE',
      'RMA Receipt': 'RETURN'
    };

    // Handle numeric type IDs
    const numericTypes = {
      1: 'RECEIPT',
      2: 'ISSUE',
      3: 'TRANSFER',
      4: 'CYCLE_COUNT',
      5: 'ADJUSTMENT'
    };

    return types[tranType] || numericTypes[tranType] || tranType;
  }
}

export default OracleWMSAdapter;
