/**
 * Oracle ERP Adapter
 * Integration with Oracle EBS, Oracle Fusion Cloud, and JD Edwards
 * Supports REST API, SOAP, and Database Direct connections
 */

import { BaseERPAdapter } from './base-adapter.js';

export class OracleAdapter extends BaseERPAdapter {
  constructor(config) {
    super(config);
    this.name = 'Oracle';
    this.erpType = config.erpType || 'FUSION'; // FUSION, EBS, JDE
    this.client = null;
  }

  /**
   * Connect to Oracle ERP
   */
  async connect() {
    this.log('info', `Connecting to Oracle ${this.erpType}...`);

    try {
      switch (this.erpType) {
        case 'FUSION':
          await this.connectFusion();
          break;
        case 'EBS':
          await this.connectEBS();
          break;
        case 'JDE':
          await this.connectJDE();
          break;
        default:
          throw new Error(`Unknown Oracle ERP type: ${this.erpType}`);
      }

      this.connected = true;
      this.log('info', 'Connected to Oracle successfully');
    } catch (error) {
      this.log('error', 'Oracle connection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Connect to Oracle Fusion Cloud
   */
  async connectFusion() {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    this.client = {
      type: 'FUSION',
      baseUrl: this.config.fusionUrl, // e.g., https://fa-xxxx.oraclecloud.com
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      request: async (endpoint, method = 'GET', body = null) => {
        this.log('debug', `Fusion ${method}: ${endpoint}`);
        return this.simulateFusionRequest(endpoint, method, body);
      }
    };
  }

  /**
   * Connect to Oracle E-Business Suite
   */
  async connectEBS() {
    this.client = {
      type: 'EBS',
      jdbcUrl: this.config.jdbcUrl,
      schema: this.config.schema || 'APPS',
      query: async (sql, params = []) => {
        this.log('debug', `EBS Query: ${sql.slice(0, 100)}...`);
        return this.simulateEBSQuery(sql, params);
      },
      callProcedure: async (procName, params) => {
        this.log('debug', `EBS Procedure: ${procName}`);
        return this.simulateEBSProcedure(procName, params);
      }
    };
  }

  /**
   * Connect to JD Edwards
   */
  async connectJDE() {
    this.client = {
      type: 'JDE',
      aisUrl: this.config.aisUrl, // Application Interface Services URL
      headers: {
        'Content-Type': 'application/json'
      },
      token: null,
      authenticate: async () => {
        // Get JDE token
        const tokenResponse = await this.simulateJDEAuth();
        this.client.token = tokenResponse.userInfo?.token;
        this.client.headers['Authorization'] = `Bearer ${this.client.token}`;
      },
      request: async (service, method = 'POST', body = null) => {
        if (!this.client.token) {
          await this.client.authenticate();
        }
        this.log('debug', `JDE ${method}: ${service}`);
        return this.simulateJDERequest(service, method, body);
      }
    };
  }

  async disconnect() {
    this.connected = false;
    this.client = null;
    this.log('info', 'Disconnected from Oracle');
  }

  async testConnection() {
    try {
      if (this.erpType === 'FUSION') {
        await this.client.request('/fscmRestApi/resources/latest/inventoryOrganizations?limit=1');
      } else if (this.erpType === 'EBS') {
        await this.client.query('SELECT 1 FROM DUAL');
      } else if (this.erpType === 'JDE') {
        await this.client.request('defaultconfig', 'GET');
      }
      return { success: true, message: 'Oracle connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // Inbound Operations (Oracle -> WMS)
  // ==========================================

  /**
   * Fetch Purchase Orders from Oracle
   */
  async fetchPurchaseOrders(options = {}) {
    const { fromDate, toDate, orgId, status } = options;

    if (this.erpType === 'FUSION') {
      let url = '/fscmRestApi/resources/latest/purchaseOrders';
      const params = [];

      if (fromDate) params.push(`CreationDate>${formatOracleDate(fromDate)}`);
      if (status) params.push(`Status=${status}`);

      if (params.length > 0) {
        url += `?q=${params.join(';')}&expand=lines`;
      }

      const result = await this.client.request(url);
      return result.items?.map(po => this.transformFusionPO(po)) || [];

    } else if (this.erpType === 'EBS') {
      const sql = `
        SELECT ph.po_header_id, ph.segment1 po_number, ph.vendor_id,
               ph.creation_date, ph.authorization_status,
               pl.po_line_id, pl.line_num, pl.item_id, pl.quantity,
               pl.unit_meas_lookup_code, pl.unit_price
        FROM po_headers_all ph
        JOIN po_lines_all pl ON ph.po_header_id = pl.po_header_id
        WHERE ph.org_id = :orgId
          AND ph.creation_date >= :fromDate
          AND ph.authorization_status = NVL(:status, ph.authorization_status)
        ORDER BY ph.segment1, pl.line_num
      `;

      const result = await this.client.query(sql, [orgId, fromDate, status]);
      return this.groupPOLines(result);

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'BROWSE',
        targetName: 'F4311',
        targetType: 'table',
        dataServiceInput: {
          query: {
            condition: [
              { value: [{ literal: fromDate }], controlId: 'F4311.PDTRDJ', operator: 'GREATER_EQUAL' }
            ]
          }
        }
      });

      return result.fs_DATABROWSE_F4311?.data?.gridData?.rowset?.map(row => this.transformJDEPO(row)) || [];
    }
  }

  /**
   * Fetch Sales Orders from Oracle
   */
  async fetchSalesOrders(options = {}) {
    const { fromDate, toDate, orgId, status } = options;

    if (this.erpType === 'FUSION') {
      let url = '/fscmRestApi/resources/latest/salesOrders';
      const params = [];

      if (fromDate) params.push(`OrderedDate>${formatOracleDate(fromDate)}`);

      if (params.length > 0) {
        url += `?q=${params.join(';')}&expand=lines`;
      }

      const result = await this.client.request(url);
      return result.items?.map(so => this.transformFusionSO(so)) || [];

    } else if (this.erpType === 'EBS') {
      const sql = `
        SELECT oh.header_id, oh.order_number, oh.sold_to_org_id,
               oh.ordered_date, oh.flow_status_code,
               ol.line_id, ol.line_number, ol.inventory_item_id,
               ol.ordered_quantity, ol.order_quantity_uom
        FROM oe_order_headers_all oh
        JOIN oe_order_lines_all ol ON oh.header_id = ol.header_id
        WHERE oh.org_id = :orgId
          AND oh.ordered_date >= :fromDate
        ORDER BY oh.order_number, ol.line_number
      `;

      const result = await this.client.query(sql, [orgId, fromDate]);
      return this.groupSOLines(result);

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'BROWSE',
        targetName: 'F4211',
        targetType: 'table',
        dataServiceInput: {
          query: {
            condition: [
              { value: [{ literal: fromDate }], controlId: 'F4211.SDTRDJ', operator: 'GREATER_EQUAL' }
            ]
          }
        }
      });

      return result.fs_DATABROWSE_F4211?.data?.gridData?.rowset?.map(row => this.transformJDESO(row)) || [];
    }
  }

  /**
   * Fetch Items from Oracle
   */
  async fetchProducts(options = {}) {
    const { orgId, changedSince } = options;

    if (this.erpType === 'FUSION') {
      const url = '/fscmRestApi/resources/latest/inventoryItems?expand=all';
      const result = await this.client.request(url);
      return result.items?.map(item => this.transformFusionItem(item)) || [];

    } else if (this.erpType === 'EBS') {
      const sql = `
        SELECT msi.inventory_item_id, msi.segment1 item_number,
               msi.description, msi.primary_uom_code,
               msi.unit_weight, msi.weight_uom_code,
               msi.item_type, msi.inventory_item_status_code
        FROM mtl_system_items_b msi
        WHERE msi.organization_id = :orgId
          AND msi.inventory_item_flag = 'Y'
          AND (:changedSince IS NULL OR msi.last_update_date >= :changedSince)
      `;

      const result = await this.client.query(sql, [orgId, changedSince]);
      return result.map(item => this.transformEBSItem(item));

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'BROWSE',
        targetName: 'F4101',
        targetType: 'table'
      });

      return result.fs_DATABROWSE_F4101?.data?.gridData?.rowset?.map(row => this.transformJDEItem(row)) || [];
    }
  }

  // ==========================================
  // Outbound Operations (WMS -> Oracle)
  // ==========================================

  /**
   * Post Receipt to Oracle
   */
  async sendReceiptConfirmation(receipt) {
    if (this.erpType === 'FUSION') {
      const payload = {
        ReceiptSourceCode: 'VENDOR',
        OrganizationCode: this.config.defaultOrg,
        lines: receipt.lines.map(line => ({
          POLineNumber: line.poLineNumber,
          POHeaderId: receipt.poHeaderId,
          QuantityReceived: line.quantity,
          UOMCode: line.uom,
          TransactionDate: new Date().toISOString(),
          SubinventoryCode: line.subinventory || this.config.defaultSubinventory
        }))
      };

      const result = await this.client.request('/fscmRestApi/resources/latest/receivingReceipts', 'POST', payload);
      return { success: true, receiptNumber: result.ReceiptNumber };

    } else if (this.erpType === 'EBS') {
      // Call RCV_TRANSACTIONS_INTERFACE procedure
      const result = await this.client.callProcedure('RCV_TRANSACTIONS_INTERFACE_PKG.PROCESS_RECEIPT', {
        p_header_id: receipt.poHeaderId,
        p_org_id: this.config.defaultOrgId,
        p_lines: receipt.lines.map(line => ({
          line_id: line.poLineId,
          quantity: line.quantity,
          uom: line.uom
        }))
      });

      return { success: true, receiptNumber: result.receipt_num };

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'ORCHESTRATOR',
        applicationName: 'P4312',
        version: 'ZJDE0001',
        inputs: {
          receiptData: {
            orderNumber: receipt.poNumber,
            lines: receipt.lines.map(line => ({
              itemNumber: line.itemNumber,
              quantity: line.quantity,
              uom: line.uom
            }))
          }
        }
      });

      return { success: true, batchNumber: result.batchNumber };
    }
  }

  /**
   * Post Shipment to Oracle
   */
  async sendShipmentConfirmation(shipment) {
    if (this.erpType === 'FUSION') {
      // Ship Confirm via REST
      const payload = {
        DeliveryId: shipment.deliveryId,
        ShipDate: new Date().toISOString(),
        ActualShipDate: shipment.shipDate,
        BillOfLading: shipment.bolNumber,
        TrackingNumber: shipment.trackingNumber,
        Carrier: shipment.carrierCode
      };

      const result = await this.client.request(
        `/fscmRestApi/resources/latest/shipments/${shipment.deliveryId}/action/shipConfirm`,
        'POST',
        payload
      );

      return { success: true, deliveryId: result.DeliveryId };

    } else if (this.erpType === 'EBS') {
      // Call WSH_DELIVERIES_PUB.DELIVERY_ACTION
      const result = await this.client.callProcedure('WSH_DELIVERIES_PUB.DELIVERY_ACTION', {
        p_delivery_id: shipment.deliveryId,
        p_action_code: 'CONFIRM',
        p_actual_dep_date: shipment.shipDate
      });

      return { success: true, deliveryId: shipment.deliveryId };

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'ORCHESTRATOR',
        applicationName: 'P4205',
        version: 'ZJDE0001',
        inputs: {
          shipmentData: {
            orderNumber: shipment.orderNumber,
            shipDate: formatJDEDate(shipment.shipDate),
            carrier: shipment.carrierCode
          }
        }
      });

      return { success: true, batchNumber: result.batchNumber };
    }
  }

  /**
   * Post Inventory Adjustment to Oracle
   */
  async sendInventoryAdjustment(adjustment) {
    if (this.erpType === 'FUSION') {
      const payload = {
        OrganizationCode: this.config.defaultOrg,
        ItemNumber: adjustment.itemNumber,
        SubinventoryCode: adjustment.subinventory,
        TransactionTypeId: adjustment.quantity > 0 ? 40 : 32, // Misc Receipt / Issue
        TransactionQuantity: Math.abs(adjustment.quantity),
        TransactionUOMCode: adjustment.uom,
        TransactionDate: new Date().toISOString(),
        TransactionReference: adjustment.reference
      };

      const result = await this.client.request('/fscmRestApi/resources/latest/inventoryTransactions', 'POST', payload);
      return { success: true, transactionId: result.TransactionId };

    } else if (this.erpType === 'EBS') {
      const result = await this.client.callProcedure('INV_QUANTITY_TREE_PUB.UPDATE_QUANTITIES', {
        p_organization_id: this.config.defaultOrgId,
        p_inventory_item_id: adjustment.itemId,
        p_subinventory_code: adjustment.subinventory,
        p_primary_quantity: adjustment.quantity,
        p_transaction_type_id: adjustment.quantity > 0 ? 40 : 32
      });

      return { success: true, transactionId: result.transaction_id };

    } else if (this.erpType === 'JDE') {
      const result = await this.client.request('v2/dataservice', 'POST', {
        dataServiceType: 'ORCHESTRATOR',
        applicationName: 'P4114',
        version: 'ZJDE0001',
        inputs: {
          adjustmentData: {
            itemNumber: adjustment.itemNumber,
            branchPlant: adjustment.branchPlant || this.config.defaultBranchPlant,
            quantity: adjustment.quantity,
            uom: adjustment.uom,
            reasonCode: adjustment.reasonCode
          }
        }
      });

      return { success: true, batchNumber: result.batchNumber };
    }
  }

  // ==========================================
  // Transformers (Oracle -> FlowLogic)
  // ==========================================

  transformFusionPO(oraclePO) {
    return {
      externalId: oraclePO.POHeaderId?.toString(),
      poNumber: oraclePO.PONumber,
      vendorId: oraclePO.SupplierId?.toString(),
      vendorName: oraclePO.SupplierName,
      orderDate: new Date(oraclePO.CreationDate),
      status: oraclePO.Status,
      currency: oraclePO.CurrencyCode,
      lines: oraclePO.lines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        description: line.ItemDescription,
        quantity: parseFloat(line.Quantity),
        uom: line.UOMCode,
        unitPrice: parseFloat(line.UnitPrice)
      })) || []
    };
  }

  transformFusionSO(oracleSO) {
    return {
      externalId: oracleSO.HeaderId?.toString(),
      orderNumber: oracleSO.OrderNumber,
      customerId: oracleSO.CustomerId?.toString(),
      customerName: oracleSO.CustomerName,
      orderDate: new Date(oracleSO.OrderedDate),
      requestedDate: new Date(oracleSO.RequestedShipDate),
      status: oracleSO.StatusCode,
      lines: oracleSO.lines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        description: line.ItemDescription,
        quantity: parseFloat(line.OrderedQuantity),
        uom: line.OrderedUOMCode
      })) || []
    };
  }

  transformFusionItem(oracleItem) {
    return {
      externalId: oracleItem.InventoryItemId?.toString(),
      sku: oracleItem.ItemNumber,
      name: oracleItem.ItemDescription,
      uom: oracleItem.PrimaryUOMCode,
      itemType: oracleItem.ItemType,
      status: oracleItem.ItemStatusCode
    };
  }

  transformEBSItem(ebsItem) {
    return {
      externalId: ebsItem.INVENTORY_ITEM_ID?.toString(),
      sku: ebsItem.ITEM_NUMBER,
      name: ebsItem.DESCRIPTION,
      uom: ebsItem.PRIMARY_UOM_CODE,
      weight: parseFloat(ebsItem.UNIT_WEIGHT) || 0,
      weightUnit: ebsItem.WEIGHT_UOM_CODE,
      itemType: ebsItem.ITEM_TYPE,
      status: ebsItem.INVENTORY_ITEM_STATUS_CODE
    };
  }

  transformJDEPO(jdeRow) {
    return {
      externalId: `${jdeRow.F4311_PDOCO}-${jdeRow.F4311_PDLNID}`,
      poNumber: jdeRow.F4311_PDOCO,
      vendorId: jdeRow.F4311_PDAN8?.toString(),
      orderDate: parseJDEDate(jdeRow.F4311_PDTRDJ),
      lineNumber: jdeRow.F4311_PDLNID,
      productSku: jdeRow.F4311_PDITM,
      quantity: parseFloat(jdeRow.F4311_PDUORG) || 0,
      uom: jdeRow.F4311_PDUOM
    };
  }

  transformJDESO(jdeRow) {
    return {
      externalId: `${jdeRow.F4211_SDDOCO}-${jdeRow.F4211_SDLNID}`,
      orderNumber: jdeRow.F4211_SDDOCO,
      customerId: jdeRow.F4211_SDAN8?.toString(),
      orderDate: parseJDEDate(jdeRow.F4211_SDTRDJ),
      lineNumber: jdeRow.F4211_SDLNID,
      productSku: jdeRow.F4211_SDITM,
      quantity: parseFloat(jdeRow.F4211_SDUORG) || 0,
      uom: jdeRow.F4211_SDUOM
    };
  }

  transformJDEItem(jdeRow) {
    return {
      externalId: jdeRow.F4101_IMITM?.toString(),
      sku: jdeRow.F4101_IMLITM,
      name: jdeRow.F4101_IMDSC1,
      uom: jdeRow.F4101_IMUOM1
    };
  }

  // Group helpers for EBS queries
  groupPOLines(rows) {
    const poMap = new Map();

    for (const row of rows) {
      const poId = row.PO_HEADER_ID;
      if (!poMap.has(poId)) {
        poMap.set(poId, {
          externalId: poId?.toString(),
          poNumber: row.PO_NUMBER,
          vendorId: row.VENDOR_ID?.toString(),
          orderDate: row.CREATION_DATE,
          status: row.AUTHORIZATION_STATUS,
          lines: []
        });
      }

      poMap.get(poId).lines.push({
        lineNumber: row.LINE_NUM,
        productId: row.ITEM_ID?.toString(),
        quantity: parseFloat(row.QUANTITY),
        uom: row.UNIT_MEAS_LOOKUP_CODE,
        unitPrice: parseFloat(row.UNIT_PRICE)
      });
    }

    return Array.from(poMap.values());
  }

  groupSOLines(rows) {
    const soMap = new Map();

    for (const row of rows) {
      const headerId = row.HEADER_ID;
      if (!soMap.has(headerId)) {
        soMap.set(headerId, {
          externalId: headerId?.toString(),
          orderNumber: row.ORDER_NUMBER,
          customerId: row.SOLD_TO_ORG_ID?.toString(),
          orderDate: row.ORDERED_DATE,
          status: row.FLOW_STATUS_CODE,
          lines: []
        });
      }

      soMap.get(headerId).lines.push({
        lineNumber: row.LINE_NUMBER,
        productId: row.INVENTORY_ITEM_ID?.toString(),
        quantity: parseFloat(row.ORDERED_QUANTITY),
        uom: row.ORDER_QUANTITY_UOM
      });
    }

    return Array.from(soMap.values());
  }

  // ==========================================
  // Simulation Methods
  // ==========================================

  async simulateFusionRequest(endpoint, method, body) {
    return { items: [], count: 0 };
  }

  async simulateEBSQuery(sql, params) {
    return [];
  }

  async simulateEBSProcedure(procName, params) {
    return { success: true };
  }

  async simulateJDEAuth() {
    return { userInfo: { token: 'mock-jde-token' } };
  }

  async simulateJDERequest(service, method, body) {
    return {};
  }
}

// Helper functions
function formatOracleDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString();
}

function formatJDEDate(date) {
  if (!date) return 0;
  const d = new Date(date);
  // JDE Julian date: CYYDDD where C=century (1=2000s), YY=year, DDD=day of year
  const year = d.getFullYear();
  const start = new Date(year, 0, 0);
  const diff = d - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const century = year >= 2000 ? 1 : 0;
  const yy = year % 100;
  return century * 100000 + yy * 1000 + dayOfYear;
}

function parseJDEDate(jdeDate) {
  if (!jdeDate) return null;
  const dateNum = parseInt(jdeDate);
  const century = Math.floor(dateNum / 100000);
  const yy = Math.floor((dateNum % 100000) / 1000);
  const ddd = dateNum % 1000;
  const year = (century === 1 ? 2000 : 1900) + yy;
  const date = new Date(year, 0, ddd);
  return date;
}

export { formatOracleDate, formatJDEDate, parseJDEDate };
