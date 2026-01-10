/**
 * FlowLogic SAP Extended Warehouse Management (EWM) Adapter
 *
 * Connects to SAP EWM via:
 * - SAP OData Services
 * - BAPI/RFC calls
 * - IDoc processing
 *
 * Supports:
 * - Real-time inventory sync
 * - Transaction history
 * - Cycle count results
 * - Warehouse task management data
 */

import { BaseWMSAdapter, ConnectionStatus, DataTypes } from '../base/index.js';

/**
 * SAP OData endpoints for EWM
 */
const SAP_ENDPOINTS = {
  // Inventory Management
  STOCK_OVERVIEW: '/sap/opu/odata/sap/API_WAREHOUSE_STOCK_SRV/A_WarehouseStock',
  HANDLING_UNIT: '/sap/opu/odata/sap/API_HANDLING_UNIT_SRV/A_HandlingUnit',
  STORAGE_BIN: '/sap/opu/odata/sap/API_WAREHOUSE_STORAGE_BIN_SRV/A_WarehouseStorageBin',

  // Warehouse Tasks
  WAREHOUSE_TASK: '/sap/opu/odata/sap/API_WAREHOUSE_TASK_SRV/A_WarehouseTask',
  WAREHOUSE_ORDER: '/sap/opu/odata/sap/API_WAREHOUSE_ORDER_SRV/A_WarehouseOrder',

  // Physical Inventory
  PHYS_INV_DOC: '/sap/opu/odata/sap/API_PHYS_INV_DOC_SRV/A_PhysInventoryDocHeader',
  PHYS_INV_ITEM: '/sap/opu/odata/sap/API_PHYS_INV_DOC_SRV/A_PhysInventoryDocItem',

  // Material Documents (movements/adjustments)
  MAT_DOC_HEADER: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader',
  MAT_DOC_ITEM: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentItem'
};

/**
 * SAP EWM Adapter
 */
export class SAPEWMAdapter extends BaseWMSAdapter {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'SAP EWM',
      type: 'sap-ewm'
    });

    this.baseUrl = config.endpoint || config.baseUrl;
    this.client = config.client || '100';
    this.username = config.username;
    this.password = config.password;
    this.apiKey = config.apiKey;
    this.warehouseNumber = config.warehouseNumber || config.settings?.warehouseNumber;

    // SAP-specific settings
    this.useBAPI = config.useBAPI || false;
    this.useIDoc = config.useIDoc || false;
  }

  getSupportedDataTypes() {
    return [
      DataTypes.INVENTORY_SNAPSHOT,
      DataTypes.TRANSACTION_HISTORY,
      DataTypes.ADJUSTMENT_LOG,
      DataTypes.CYCLE_COUNT_RESULTS,
      DataTypes.LOCATION_MASTER
    ];
  }

  getSupportedMethods() {
    return ['REST API', 'BAPI', 'IDoc', 'RFC'];
  }

  /**
   * Test connection to SAP system
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

      // Test with a simple metadata request
      const testUrl = `${this.baseUrl}/sap/opu/odata/sap/API_WAREHOUSE_STOCK_SRV/$metadata`;
      const startTime = Date.now();

      const response = await this.makeRequest(testUrl, { method: 'GET' });

      this.status = ConnectionStatus.CONNECTED;

      return {
        success: true,
        message: 'Connection successful',
        details: {
          endpoint: this.baseUrl,
          client: this.client,
          warehouseNumber: this.warehouseNumber,
          responseTime: Date.now() - startTime,
          serverInfo: 'SAP EWM OData Services'
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
   * Authenticate with SAP
   */
  async authenticate() {
    try {
      // SAP uses Basic Auth for OData or OAuth for newer systems
      if (this.apiKey) {
        this.authToken = this.apiKey;
        return { success: true, token: this.apiKey };
      }

      // Basic Auth - create base64 encoded credentials
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      this.authToken = credentials;

      // For SAP systems using OAuth 2.0
      if (this.config.useOAuth) {
        const tokenUrl = `${this.baseUrl}/sap/bc/sec/oauth2/token`;
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          body: 'grant_type=client_credentials'
        });

        if (response.ok) {
          const data = await response.json();
          this.authToken = data.access_token;
          this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
          return { success: true, token: this.authToken, expiry: this.tokenExpiry };
        }
      }

      return { success: true, token: this.authToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build authorization header for SAP requests
   */
  getAuthHeaders() {
    if (this.config.useOAuth) {
      return { 'Authorization': `Bearer ${this.authToken}` };
    }
    // Basic Auth for SAP OData
    return {
      'Authorization': `Basic ${this.authToken}`,
      'sap-client': this.client
    };
  }

  /**
   * Fetch data from SAP EWM
   */
  async fetchData(dataType, options = {}) {
    try {
      await this.refreshAuthIfNeeded();

      let endpoint;
      let params = new URLSearchParams();

      // Add common OData parameters
      params.append('$format', 'json');
      if (options.top) params.append('$top', options.top);
      if (options.skip) params.append('$skip', options.skip);

      switch (dataType) {
        case DataTypes.INVENTORY_SNAPSHOT:
          endpoint = SAP_ENDPOINTS.STOCK_OVERVIEW;
          if (this.warehouseNumber) {
            params.append('$filter', `WarehouseNumber eq '${this.warehouseNumber}'`);
          }
          params.append('$select', 'Material,Plant,StorageLocation,Batch,StockQuantityInBaseUnit,BaseUnit,WarehouseNumber,StorageBin');
          break;

        case DataTypes.TRANSACTION_HISTORY:
          endpoint = SAP_ENDPOINTS.MAT_DOC_ITEM;
          if (options.dateFrom) {
            params.append('$filter', `PostingDate ge datetime'${options.dateFrom.toISOString()}'`);
          }
          params.append('$select', 'MaterialDocumentYear,MaterialDocument,MaterialDocumentItem,Material,Plant,StorageLocation,GoodsMovementType,QuantityInBaseUnit,BaseUnit,PostingDate');
          break;

        case DataTypes.CYCLE_COUNT_RESULTS:
          endpoint = SAP_ENDPOINTS.PHYS_INV_ITEM;
          params.append('$expand', 'to_PhysInventoryDocHeader');
          params.append('$select', 'PhysicalInventoryDocument,FiscalYear,PhysicalInventoryDocumentItem,Material,Plant,StorageLocation,BookQuantityInStockUoM,CountedQuantityInStockUoM,DifferenceQuantityInStockUoM,StockUnit');
          break;

        case DataTypes.ADJUSTMENT_LOG:
          endpoint = SAP_ENDPOINTS.MAT_DOC_ITEM;
          // Filter for adjustment movement types (e.g., 701, 702 for inventory adjustments)
          params.append('$filter', `(GoodsMovementType eq '701' or GoodsMovementType eq '702' or GoodsMovementType eq '711' or GoodsMovementType eq '712')`);
          break;

        case DataTypes.LOCATION_MASTER:
          endpoint = SAP_ENDPOINTS.STORAGE_BIN;
          if (this.warehouseNumber) {
            params.append('$filter', `WarehouseNumber eq '${this.warehouseNumber}'`);
          }
          break;

        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      const url = `${this.baseUrl}${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`SAP API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // SAP OData returns results in d.results array
      const data = result.d?.results || result.value || [];

      return {
        success: true,
        data,
        count: data.length,
        hasMore: !!result.d?.__next
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
   * Transform SAP data to FlowLogic schema
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
      default:
        return rawData;
    }
  }

  /**
   * Transform SAP inventory to FlowLogic schema
   */
  transformInventory(rawData) {
    return rawData.map(item => ({
      sku: item.Material || item.MATNR,
      locationCode: item.StorageBin || item.StorageLocation || item.LGPLA,
      quantityOnHand: this.parseNumber(item.StockQuantityInBaseUnit || item.VERME),
      quantityAllocated: this.parseNumber(item.AllocatedQuantity || 0),
      quantityAvailable: this.parseNumber(item.AvailableQuantity || item.StockQuantityInBaseUnit || item.VERME),
      lotNumber: item.Batch || item.CHARG || null,
      expirationDate: this.parseDate(item.ShelfLifeExpirationDate || item.VFDAT),
      unitOfMeasure: item.BaseUnit || item.EINME,
      warehouse: item.WarehouseNumber || item.LGNUM,
      plant: item.Plant || item.WERKS,
      rawData: item
    }));
  }

  /**
   * Transform SAP transactions to FlowLogic schema
   */
  transformTransactions(rawData) {
    return rawData.map(item => ({
      transactionId: `${item.MaterialDocumentYear}-${item.MaterialDocument}-${item.MaterialDocumentItem}`,
      type: this.mapMovementType(item.GoodsMovementType),
      sku: item.Material || item.MATNR,
      fromLocation: item.IssuingStorageLocation || null,
      toLocation: item.ReceivingStorageLocation || item.StorageLocation,
      quantity: this.parseNumber(item.QuantityInBaseUnit),
      userId: item.CreatedByUser || null,
      transactionDate: this.parseDate(item.PostingDate),
      movementType: item.GoodsMovementType,
      rawData: item
    }));
  }

  /**
   * Transform SAP cycle counts to FlowLogic schema
   */
  transformCycleCounts(rawData) {
    return rawData.map(item => ({
      countId: `${item.FiscalYear}-${item.PhysicalInventoryDocument}-${item.PhysicalInventoryDocumentItem}`,
      sku: item.Material,
      locationCode: item.StorageLocation,
      systemQty: this.parseNumber(item.BookQuantityInStockUoM),
      countedQty: this.parseNumber(item.CountedQuantityInStockUoM),
      variance: this.parseNumber(item.DifferenceQuantityInStockUoM),
      variancePercent: item.BookQuantityInStockUoM ?
        (this.parseNumber(item.DifferenceQuantityInStockUoM) / this.parseNumber(item.BookQuantityInStockUoM)) * 100 : 0,
      unitOfMeasure: item.StockUnit,
      countDate: this.parseDate(item.to_PhysInventoryDocHeader?.PhysInventoryCountDate),
      rawData: item
    }));
  }

  /**
   * Transform SAP adjustments to FlowLogic schema
   */
  transformAdjustments(rawData) {
    return rawData.map(item => ({
      adjustmentId: `${item.MaterialDocumentYear}-${item.MaterialDocument}-${item.MaterialDocumentItem}`,
      sku: item.Material,
      locationCode: item.StorageLocation,
      adjustmentQty: this.parseNumber(item.QuantityInBaseUnit),
      reason: this.mapAdjustmentReason(item.GoodsMovementType),
      reasonCode: item.GoodsMovementType,
      userId: item.CreatedByUser,
      adjustmentDate: this.parseDate(item.PostingDate),
      rawData: item
    }));
  }

  /**
   * Transform SAP locations to FlowLogic schema
   */
  transformLocations(rawData) {
    return rawData.map(item => ({
      locationCode: item.StorageBin,
      warehouse: item.WarehouseNumber,
      storageType: item.StorageType,
      aisle: item.WarehouseAisle,
      zone: item.StorageSection,
      maxWeight: this.parseNumber(item.MaximumWeight),
      maxVolume: this.parseNumber(item.MaximumVolume),
      isActive: item.StorageBinIsLocked !== 'X',
      rawData: item
    }));
  }

  /**
   * Map SAP movement type to readable type
   */
  mapMovementType(movementType) {
    const types = {
      '101': 'GOODS_RECEIPT',
      '102': 'GOODS_RECEIPT_REVERSAL',
      '201': 'GOODS_ISSUE',
      '202': 'GOODS_ISSUE_REVERSAL',
      '301': 'TRANSFER_POSTING',
      '302': 'TRANSFER_POSTING_REVERSAL',
      '311': 'STOCK_TRANSFER',
      '312': 'STOCK_TRANSFER_REVERSAL',
      '501': 'PRODUCTION_RECEIPT',
      '502': 'PRODUCTION_RECEIPT_REVERSAL',
      '601': 'DELIVERY_GOODS_ISSUE',
      '602': 'DELIVERY_GOODS_ISSUE_REVERSAL',
      '701': 'INVENTORY_ADJUSTMENT_PLUS',
      '702': 'INVENTORY_ADJUSTMENT_MINUS',
      '711': 'CYCLE_COUNT_ADJUSTMENT_PLUS',
      '712': 'CYCLE_COUNT_ADJUSTMENT_MINUS'
    };
    return types[movementType] || `MOVEMENT_${movementType}`;
  }

  /**
   * Map adjustment reason from movement type
   */
  mapAdjustmentReason(movementType) {
    const reasons = {
      '701': 'Inventory Adjustment (Positive)',
      '702': 'Inventory Adjustment (Negative)',
      '711': 'Cycle Count Adjustment (Positive)',
      '712': 'Cycle Count Adjustment (Negative)'
    };
    return reasons[movementType] || 'Adjustment';
  }
}

export default SAPEWMAdapter;
