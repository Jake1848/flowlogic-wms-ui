/**
 * Apache OFBiz WMS Adapter
 *
 * Connects to OFBiz REST API for inventory management
 * Docs: https://cwiki.apache.org/confluence/display/OFBIZ/REST+Service+Implementation
 */

import { BaseWMSAdapter } from './base/index.js';

export class OFBizAdapter extends BaseWMSAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://localhost:8443';
    this.username = config.username;
    this.password = config.password;
    this.accessToken = null;
    this.refreshToken = null;
    this.facilityId = config.facilityId || 'WebStoreWarehouse';
  }

  /**
   * Authenticate with OFBiz using Basic Auth to get JWT token
   */
  async connect() {
    try {
      const authString = Buffer.from(`${this.username}:${this.password}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/rest/auth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.connected = true;

      console.log('Connected to OFBiz successfully');
      return true;
    } catch (error) {
      console.error('OFBiz connection error:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/rest/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });

      if (!response.ok) {
        // Token expired, need to re-authenticate
        return this.connect();
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return this.connect();
    }
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, method = 'GET', body = null) {
    if (!this.accessToken) {
      await this.connect();
    }

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, options);

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      await this.refreshAccessToken();
      options.headers['Authorization'] = `Bearer ${this.accessToken}`;
      response = await fetch(`${this.baseUrl}${endpoint}`, options);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch inventory levels from OFBiz
   */
  async fetchInventory() {
    try {
      // OFBiz service: findProductInventoryItems
      const data = await this.apiRequest('/rest/services/findProductInventoryItems', 'POST', {
        facilityId: this.facilityId
      });

      // Transform OFBiz inventory format to FlowLogic format
      const inventory = (data.inventoryItems || []).map(item => ({
        sku: item.productId,
        locationCode: item.locationSeqId || item.facilityId,
        quantityOnHand: parseFloat(item.quantityOnHandTotal) || 0,
        quantityAvailable: parseFloat(item.availableToPromiseTotal) || 0,
        quantityAllocated: (parseFloat(item.quantityOnHandTotal) || 0) - (parseFloat(item.availableToPromiseTotal) || 0),
        lotNumber: item.lotId,
        expirationDate: item.expireDate,
        lastUpdated: item.lastUpdatedStamp,
        rawData: item
      }));

      return inventory;
    } catch (error) {
      console.error('Error fetching OFBiz inventory:', error);
      throw error;
    }
  }

  /**
   * Fetch inventory by facility
   */
  async fetchInventoryByFacility(facilityId = this.facilityId) {
    try {
      const data = await this.apiRequest('/rest/services/getInventoryAvailableByFacility', 'POST', {
        facilityId
      });

      return (data.results || []).map(item => ({
        sku: item.productId,
        locationCode: facilityId,
        quantityOnHand: parseFloat(item.quantityOnHandTotal) || 0,
        quantityAvailable: parseFloat(item.availableToPromiseTotal) || 0,
        quantityAllocated: 0,
        rawData: item
      }));
    } catch (error) {
      console.error('Error fetching facility inventory:', error);
      throw error;
    }
  }

  /**
   * Fetch transactions/movements
   */
  async fetchTransactions(startDate, endDate) {
    try {
      const data = await this.apiRequest('/rest/services/findInventoryItemDetails', 'POST', {
        facilityId: this.facilityId,
        fromDate: startDate,
        thruDate: endDate
      });

      return (data.inventoryItemDetails || []).map(tx => ({
        transactionId: tx.inventoryItemDetailSeqId,
        sku: tx.productId,
        locationCode: tx.facilityId,
        type: this.mapTransactionType(tx.reasonEnumId),
        quantity: parseFloat(tx.quantityOnHandDiff) || 0,
        timestamp: tx.effectiveDate,
        userId: tx.createdByUserLogin,
        reason: tx.reasonEnumId,
        rawData: tx
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Map OFBiz reason codes to FlowLogic transaction types
   */
  mapTransactionType(reasonEnumId) {
    const typeMap = {
      'INV_RECEIPT': 'RECEIPT',
      'INV_RETURN': 'RETURN',
      'INV_SALE': 'PICK',
      'INV_ADJUSTMENT': 'ADJUSTMENT',
      'INV_TRANSFER': 'TRANSFER',
      'INV_SHRINKAGE': 'SHRINKAGE',
      'INV_DAMAGED': 'DAMAGED'
    };
    return typeMap[reasonEnumId] || 'OTHER';
  }

  /**
   * Fetch physical inventory counts
   */
  async fetchCycleCounts(startDate, endDate) {
    try {
      const data = await this.apiRequest('/rest/services/findPhysicalInventory', 'POST', {
        facilityId: this.facilityId,
        fromDate: startDate,
        thruDate: endDate
      });

      return (data.physicalInventories || []).map(count => ({
        countId: count.physicalInventoryId,
        sku: count.productId,
        locationCode: count.locationSeqId || count.facilityId,
        expectedQuantity: parseFloat(count.expectedQuantity) || 0,
        countedQuantity: parseFloat(count.countedQuantity) || 0,
        variance: (parseFloat(count.countedQuantity) || 0) - (parseFloat(count.expectedQuantity) || 0),
        timestamp: count.physicalInventoryDate,
        userId: count.createdByUserLogin,
        rawData: count
      }));
    } catch (error) {
      console.error('Error fetching cycle counts:', error);
      throw error;
    }
  }

  /**
   * Get list of facilities (warehouses)
   */
  async fetchFacilities() {
    try {
      const data = await this.apiRequest('/rest/services/findFacilities', 'POST', {
        facilityTypeId: 'WAREHOUSE'
      });

      return (data.facilities || []).map(f => ({
        id: f.facilityId,
        name: f.facilityName,
        type: f.facilityTypeId,
        rawData: f
      }));
    } catch (error) {
      console.error('Error fetching facilities:', error);
      throw error;
    }
  }

  /**
   * Get product details
   */
  async fetchProduct(productId) {
    try {
      const data = await this.apiRequest(`/rest/services/getProduct`, 'POST', {
        productId
      });

      return {
        sku: data.productId,
        name: data.productName,
        description: data.description,
        uom: data.quantityUomId,
        rawData: data
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async disconnect() {
    this.accessToken = null;
    this.refreshToken = null;
    this.connected = false;
  }

  async testConnection() {
    try {
      await this.connect();
      // Try to fetch facilities to verify API access
      await this.fetchFacilities();
      return { success: true, message: 'Connected to OFBiz successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default OFBizAdapter;
