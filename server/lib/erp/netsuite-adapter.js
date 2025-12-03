/**
 * NetSuite ERP Adapter
 * Integration with Oracle NetSuite via SuiteTalk REST/SOAP and SuiteScript
 */

import { BaseERPAdapter } from './base-adapter.js';
import crypto from 'crypto';

export class NetSuiteAdapter extends BaseERPAdapter {
  constructor(config) {
    super(config);
    this.name = 'NetSuite';
    this.client = null;
    this.accountId = config.accountId;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.tokenId = config.tokenId;
    this.tokenSecret = config.tokenSecret;
  }

  /**
   * Connect to NetSuite
   */
  async connect() {
    this.log('info', 'Connecting to NetSuite...');

    try {
      // NetSuite REST API base URL
      const baseUrl = `https://${this.accountId.replace('_', '-')}.suitetalk.api.netsuite.com/services/rest`;

      this.client = {
        baseUrl,
        recordUrl: `${baseUrl}/record/v1`,
        queryUrl: `${baseUrl}/query/v1`,
        request: async (endpoint, method = 'GET', body = null) => {
          const url = endpoint.startsWith('http') ? endpoint : `${this.client.recordUrl}${endpoint}`;
          const headers = this.generateOAuthHeaders(method, url);

          this.log('debug', `NetSuite ${method}: ${endpoint}`);
          return this.simulateRequest(endpoint, method, body);
        },
        query: async (suiteQL) => {
          const url = `${this.client.queryUrl}/suiteql`;
          const headers = this.generateOAuthHeaders('POST', url);

          this.log('debug', `NetSuite Query: ${suiteQL.slice(0, 100)}...`);
          return this.simulateQuery(suiteQL);
        }
      };

      this.connected = true;
      this.log('info', 'Connected to NetSuite successfully');
    } catch (error) {
      this.log('error', 'NetSuite connection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate OAuth 1.0 headers for NetSuite
   */
  generateOAuthHeaders(method, url) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_token: this.tokenId,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    // Build signature base string
    const baseString = this.buildBaseString(method, url, oauthParams);
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(this.tokenSecret)}`;
    const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');

    oauthParams.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth realm="' + this.accountId + '", ' +
      Object.entries(oauthParams)
        .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
        .join(', ');

    return {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  buildBaseString(method, url, params) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    return `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  }

  async disconnect() {
    this.connected = false;
    this.client = null;
    this.log('info', 'Disconnected from NetSuite');
  }

  async testConnection() {
    try {
      await this.client.request('/company');
      return { success: true, message: 'NetSuite connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // Inbound Operations (NetSuite -> WMS)
  // ==========================================

  /**
   * Fetch Purchase Orders from NetSuite
   */
  async fetchPurchaseOrders(options = {}) {
    const { fromDate, toDate, status, subsidiary } = options;

    // Using SuiteQL for complex queries
    let query = `
      SELECT
        t.id, t.tranid, t.trandate, t.entity, t.status,
        t.subsidiary, t.currency,
        tl.id as line_id, tl.item, tl.quantity, tl.units,
        tl.rate, tl.amount,
        i.itemid, i.displayname
      FROM transaction t
      JOIN transactionline tl ON t.id = tl.transaction
      JOIN item i ON tl.item = i.id
      WHERE t.type = 'PurchOrd'
    `;

    const conditions = [];
    if (fromDate) conditions.push(`t.trandate >= TO_DATE('${formatNetSuiteDate(fromDate)}', 'YYYY-MM-DD')`);
    if (toDate) conditions.push(`t.trandate <= TO_DATE('${formatNetSuiteDate(toDate)}', 'YYYY-MM-DD')`);
    if (status) conditions.push(`t.status = '${status}'`);
    if (subsidiary) conditions.push(`t.subsidiary = ${subsidiary}`);

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY t.tranid, tl.id';

    const result = await this.client.query(query);
    return this.groupPOResults(result.items || []);
  }

  /**
   * Fetch Sales Orders from NetSuite
   */
  async fetchSalesOrders(options = {}) {
    const { fromDate, toDate, status, subsidiary } = options;

    let query = `
      SELECT
        t.id, t.tranid, t.trandate, t.entity, t.status,
        t.shipdate, t.shipmethod, t.shipaddress,
        tl.id as line_id, tl.item, tl.quantity, tl.units,
        tl.rate, tl.amount, tl.quantitycommitted, tl.quantityfulfilled,
        i.itemid, i.displayname
      FROM transaction t
      JOIN transactionline tl ON t.id = tl.transaction
      JOIN item i ON tl.item = i.id
      WHERE t.type = 'SalesOrd'
        AND tl.mainline = 'F'
    `;

    const conditions = [];
    if (fromDate) conditions.push(`t.trandate >= TO_DATE('${formatNetSuiteDate(fromDate)}', 'YYYY-MM-DD')`);
    if (status) conditions.push(`t.status = '${status}'`);

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    const result = await this.client.query(query);
    return this.groupSOResults(result.items || []);
  }

  /**
   * Fetch Items from NetSuite
   */
  async fetchProducts(options = {}) {
    const { itemType, subsidiary, changedSince } = options;

    let query = `
      SELECT
        i.id, i.itemid, i.displayname, i.description,
        i.itemtype, i.baseunit, i.isinactive,
        i.weightunit, i.weight,
        i.custitem_upc, i.custitem_ean
      FROM item i
      WHERE i.isinactive = 'F'
    `;

    if (itemType) query += ` AND i.itemtype = '${itemType}'`;
    if (changedSince) query += ` AND i.lastmodifieddate >= TO_DATE('${formatNetSuiteDate(changedSince)}', 'YYYY-MM-DD')`;

    const result = await this.client.query(query);
    return result.items?.map(item => this.transformItem(item)) || [];
  }

  /**
   * Fetch Customers from NetSuite
   */
  async fetchCustomers(options = {}) {
    const query = `
      SELECT
        c.id, c.entityid, c.companyname, c.email, c.phone,
        c.defaultbillingaddress, c.defaultshippingaddress,
        c.isinactive, c.terms, c.creditlimit
      FROM customer c
      WHERE c.isinactive = 'F'
    `;

    const result = await this.client.query(query);
    return result.items?.map(cust => this.transformCustomer(cust)) || [];
  }

  /**
   * Fetch Vendors from NetSuite
   */
  async fetchVendors(options = {}) {
    const query = `
      SELECT
        v.id, v.entityid, v.companyname, v.email, v.phone,
        v.defaultaddress, v.isinactive, v.terms
      FROM vendor v
      WHERE v.isinactive = 'F'
    `;

    const result = await this.client.query(query);
    return result.items?.map(vend => this.transformVendor(vend)) || [];
  }

  // ==========================================
  // Outbound Operations (WMS -> NetSuite)
  // ==========================================

  /**
   * Create Item Receipt in NetSuite
   */
  async sendReceiptConfirmation(receipt) {
    const itemReceiptPayload = {
      createdFrom: { id: receipt.poId },
      tranDate: formatNetSuiteDate(receipt.receiptDate || new Date()),
      memo: receipt.memo || `WMS Receipt ${receipt.receiptNumber}`,
      item: {
        items: receipt.lines.map(line => ({
          orderLine: line.poLineId,
          item: { id: line.itemId },
          quantity: line.quantity,
          location: { id: line.locationId || this.config.defaultLocationId },
          inventoryDetail: line.lotNumber ? {
            inventoryAssignment: {
              items: [{
                receiptInventoryNumber: line.lotNumber,
                quantity: line.quantity,
                expirationDate: line.expirationDate
              }]
            }
          } : undefined
        }))
      }
    };

    const result = await this.client.request('/itemReceipt', 'POST', itemReceiptPayload);
    return { success: true, receiptId: result.id, receiptNumber: result.tranId };
  }

  /**
   * Create Item Fulfillment in NetSuite
   */
  async sendShipmentConfirmation(shipment) {
    const fulfillmentPayload = {
      createdFrom: { id: shipment.salesOrderId },
      tranDate: formatNetSuiteDate(shipment.shipDate || new Date()),
      shipStatus: 'C', // Shipped
      shipMethod: shipment.shipMethodId ? { id: shipment.shipMethodId } : undefined,
      memo: shipment.memo || `WMS Shipment ${shipment.shipmentNumber}`,
      package: {
        items: shipment.packages?.map(pkg => ({
          packageWeight: pkg.weight,
          packageDescr: pkg.description,
          packageTrackingNumber: pkg.trackingNumber
        })) || []
      },
      item: {
        items: shipment.lines.map(line => ({
          orderLine: line.orderLineId,
          item: { id: line.itemId },
          quantity: line.quantity,
          location: { id: line.locationId || this.config.defaultLocationId },
          inventoryDetail: line.lotNumber ? {
            inventoryAssignment: {
              items: [{
                issueInventoryNumber: line.lotNumber,
                quantity: line.quantity
              }]
            }
          } : undefined
        }))
      }
    };

    const result = await this.client.request('/itemFulfillment', 'POST', fulfillmentPayload);
    return { success: true, fulfillmentId: result.id, fulfillmentNumber: result.tranId };
  }

  /**
   * Create Inventory Adjustment in NetSuite
   */
  async sendInventoryAdjustment(adjustment) {
    const adjustmentPayload = {
      tranDate: formatNetSuiteDate(adjustment.adjustmentDate || new Date()),
      account: { id: adjustment.accountId || this.config.defaultAdjustmentAccountId },
      adjLocation: { id: adjustment.locationId || this.config.defaultLocationId },
      subsidiary: { id: adjustment.subsidiaryId || this.config.defaultSubsidiaryId },
      memo: adjustment.memo || `WMS Adjustment ${adjustment.referenceNumber}`,
      inventory: {
        items: [{
          item: { id: adjustment.itemId },
          location: { id: adjustment.locationId || this.config.defaultLocationId },
          adjustQtyBy: adjustment.quantity,
          unitCost: adjustment.unitCost,
          inventoryDetail: adjustment.lotNumber ? {
            inventoryAssignment: {
              items: [{
                inventoryNumber: adjustment.lotNumber,
                quantity: Math.abs(adjustment.quantity)
              }]
            }
          } : undefined
        }]
      }
    };

    const result = await this.client.request('/inventoryAdjustment', 'POST', adjustmentPayload);
    return { success: true, adjustmentId: result.id, adjustmentNumber: result.tranId };
  }

  /**
   * Create Transfer Order in NetSuite
   */
  async sendTransferOrder(transfer) {
    const transferPayload = {
      tranDate: formatNetSuiteDate(transfer.transferDate || new Date()),
      location: { id: transfer.fromLocationId },
      transferLocation: { id: transfer.toLocationId },
      subsidiary: { id: transfer.subsidiaryId || this.config.defaultSubsidiaryId },
      memo: transfer.memo || `WMS Transfer ${transfer.referenceNumber}`,
      item: {
        items: transfer.lines.map(line => ({
          item: { id: line.itemId },
          quantity: line.quantity,
          units: line.unitsId
        }))
      }
    };

    const result = await this.client.request('/transferOrder', 'POST', transferPayload);
    return { success: true, transferId: result.id, transferNumber: result.tranId };
  }

  // ==========================================
  // Transformers (NetSuite -> FlowLogic)
  // ==========================================

  transformItem(nsItem) {
    return {
      externalId: nsItem.id?.toString(),
      sku: nsItem.itemid,
      name: nsItem.displayname || nsItem.itemid,
      description: nsItem.description,
      uom: nsItem.baseunit,
      weight: parseFloat(nsItem.weight) || 0,
      weightUnit: nsItem.weightunit,
      upc: nsItem.custitem_upc,
      ean: nsItem.custitem_ean,
      isActive: nsItem.isinactive !== 'T'
    };
  }

  transformCustomer(nsCust) {
    return {
      externalId: nsCust.id?.toString(),
      code: nsCust.entityid,
      name: nsCust.companyname || nsCust.entityid,
      email: nsCust.email,
      phone: nsCust.phone,
      creditLimit: parseFloat(nsCust.creditlimit) || 0,
      isActive: nsCust.isinactive !== 'T'
    };
  }

  transformVendor(nsVend) {
    return {
      externalId: nsVend.id?.toString(),
      code: nsVend.entityid,
      name: nsVend.companyname || nsVend.entityid,
      email: nsVend.email,
      phone: nsVend.phone,
      isActive: nsVend.isinactive !== 'T'
    };
  }

  groupPOResults(rows) {
    const poMap = new Map();

    for (const row of rows) {
      const poId = row.id;
      if (!poMap.has(poId)) {
        poMap.set(poId, {
          externalId: poId?.toString(),
          poNumber: row.tranid,
          vendorId: row.entity?.toString(),
          orderDate: row.trandate,
          status: row.status,
          currency: row.currency,
          lines: []
        });
      }

      poMap.get(poId).lines.push({
        lineId: row.line_id?.toString(),
        productId: row.item?.toString(),
        productSku: row.itemid,
        productName: row.displayname,
        quantity: parseFloat(row.quantity) || 0,
        uom: row.units,
        unitPrice: parseFloat(row.rate) || 0,
        amount: parseFloat(row.amount) || 0
      });
    }

    return Array.from(poMap.values());
  }

  groupSOResults(rows) {
    const soMap = new Map();

    for (const row of rows) {
      const soId = row.id;
      if (!soMap.has(soId)) {
        soMap.set(soId, {
          externalId: soId?.toString(),
          orderNumber: row.tranid,
          customerId: row.entity?.toString(),
          orderDate: row.trandate,
          requestedShipDate: row.shipdate,
          status: row.status,
          shipMethod: row.shipmethod,
          lines: []
        });
      }

      soMap.get(soId).lines.push({
        lineId: row.line_id?.toString(),
        productId: row.item?.toString(),
        productSku: row.itemid,
        productName: row.displayname,
        quantity: parseFloat(row.quantity) || 0,
        quantityCommitted: parseFloat(row.quantitycommitted) || 0,
        quantityFulfilled: parseFloat(row.quantityfulfilled) || 0,
        uom: row.units,
        unitPrice: parseFloat(row.rate) || 0
      });
    }

    return Array.from(soMap.values());
  }

  // ==========================================
  // Simulation Methods
  // ==========================================

  async simulateRequest(endpoint, method, body) {
    if (method === 'POST') {
      return { id: Date.now(), tranId: `WMS-${Date.now()}` };
    }
    return {};
  }

  async simulateQuery(suiteQL) {
    return { items: [], totalResults: 0 };
  }
}

// Helper functions
function formatNetSuiteDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export { formatNetSuiteDate };
