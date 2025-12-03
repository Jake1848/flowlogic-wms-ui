/**
 * SAP ERP Adapter
 * Integration with SAP ECC and S/4HANA systems
 * Supports RFC, BAPI, IDoc, and OData connections
 */

import { BaseERPAdapter } from './base-adapter.js';

export class SAPAdapter extends BaseERPAdapter {
  constructor(config) {
    super(config);
    this.name = 'SAP';
    this.connectionType = config.connectionType || 'RFC'; // RFC, ODATA, IDOC
    this.client = null;
  }

  /**
   * Connect to SAP system
   */
  async connect() {
    this.log('info', 'Connecting to SAP...');

    try {
      switch (this.connectionType) {
        case 'RFC':
          await this.connectRFC();
          break;
        case 'ODATA':
          await this.connectOData();
          break;
        case 'IDOC':
          await this.connectIDoc();
          break;
        default:
          throw new Error(`Unknown connection type: ${this.connectionType}`);
      }

      this.connected = true;
      this.log('info', 'Connected to SAP successfully');
    } catch (error) {
      this.log('error', 'SAP connection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Connect via RFC (Remote Function Call)
   */
  async connectRFC() {
    // In production, use node-rfc library
    // const rfc = require('node-rfc');
    // this.client = new rfc.Client(this.config.rfcConnection);
    // await this.client.open();

    // Simulated connection for development
    this.client = {
      type: 'RFC',
      systemId: this.config.systemId || 'DEV',
      client: this.config.client || '100',
      call: async (functionName, params) => {
        this.log('debug', `RFC Call: ${functionName}`, params);
        return this.simulateRFCCall(functionName, params);
      }
    };
  }

  /**
   * Connect via OData (S/4HANA, Cloud)
   */
  async connectOData() {
    const baseUrl = this.config.odataUrl;
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    this.client = {
      type: 'ODATA',
      baseUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      request: async (endpoint, method = 'GET', body = null) => {
        // In production, use actual HTTP client
        this.log('debug', `OData ${method}: ${endpoint}`);
        return this.simulateODataRequest(endpoint, method, body);
      }
    };
  }

  /**
   * Connect for IDoc processing
   */
  async connectIDoc() {
    this.client = {
      type: 'IDOC',
      partnerNumber: this.config.partnerNumber,
      partnerType: this.config.partnerType || 'LS',
      messageType: null,
      send: async (idoc) => {
        this.log('debug', 'Sending IDoc', { type: idoc.IDOCTYP });
        return this.simulateIDocSend(idoc);
      },
      receive: async (messageType) => {
        this.log('debug', `Receiving IDocs: ${messageType}`);
        return this.simulateIDocReceive(messageType);
      }
    };
  }

  async disconnect() {
    if (this.client?.close) {
      await this.client.close();
    }
    this.connected = false;
    this.client = null;
    this.log('info', 'Disconnected from SAP');
  }

  async testConnection() {
    try {
      if (this.connectionType === 'RFC') {
        await this.client.call('RFC_PING', {});
      } else if (this.connectionType === 'ODATA') {
        await this.client.request('/$metadata');
      }
      return { success: true, message: 'SAP connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // Inbound Operations (SAP -> WMS)
  // ==========================================

  /**
   * Fetch Purchase Orders from SAP
   */
  async fetchPurchaseOrders(options = {}) {
    const { fromDate, toDate, plant, status } = options;

    if (this.connectionType === 'RFC') {
      // BAPI_PO_GETITEMS or custom Z function
      const result = await this.client.call('BAPI_PO_GETITEMS', {
        PLANT: plant || this.config.defaultPlant,
        PURCH_ORG: this.config.purchasingOrg,
        OPEN_PO: status === 'OPEN' ? 'X' : '',
        DOC_DATE_FROM: formatSAPDate(fromDate),
        DOC_DATE_TO: formatSAPDate(toDate)
      });

      return result.PO_ITEMS?.map(po => this.transformPurchaseOrder(po)) || [];

    } else if (this.connectionType === 'ODATA') {
      // S/4HANA OData service
      let url = `/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder`;
      const filters = [];

      if (fromDate) filters.push(`PurchaseOrderDate ge datetime'${fromDate.toISOString()}'`);
      if (toDate) filters.push(`PurchaseOrderDate le datetime'${toDate.toISOString()}'`);
      if (plant) filters.push(`Plant eq '${plant}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=to_PurchaseOrderItem`;
      }

      const result = await this.client.request(url);
      return result.d?.results?.map(po => this.transformPurchaseOrderOData(po)) || [];
    }
  }

  /**
   * Fetch Sales Orders / Delivery Orders from SAP
   */
  async fetchSalesOrders(options = {}) {
    const { fromDate, toDate, salesOrg, deliveryStatus } = options;

    if (this.connectionType === 'RFC') {
      // SD_SALESDOCUMENT_READ or BAPI_SALESORDER_GETLIST
      const result = await this.client.call('BAPI_SALESORDER_GETLIST', {
        SALES_ORGANIZATION: salesOrg || this.config.salesOrg,
        DOCUMENT_DATE: formatSAPDate(fromDate),
        DOCUMENT_DATE_TO: formatSAPDate(toDate),
        OPEN_ORDERS: 'X'
      });

      return result.SALES_ORDERS?.map(so => this.transformSalesOrder(so)) || [];

    } else if (this.connectionType === 'ODATA') {
      let url = `/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder`;
      const filters = [];

      if (fromDate) filters.push(`SalesOrderDate ge datetime'${fromDate.toISOString()}'`);
      if (salesOrg) filters.push(`SalesOrganization eq '${salesOrg}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=to_Item`;
      }

      const result = await this.client.request(url);
      return result.d?.results?.map(so => this.transformSalesOrderOData(so)) || [];
    }
  }

  /**
   * Fetch Materials/Products from SAP
   */
  async fetchProducts(options = {}) {
    const { materialType, plant, changedSince } = options;

    if (this.connectionType === 'RFC') {
      const result = await this.client.call('BAPI_MATERIAL_GETLIST', {
        MATNRSELECTION: [{
          SIGN: 'I',
          OPTION: 'CP',
          MATNR_LOW: '*'
        }],
        PLANTSELECTION: plant ? [{ SIGN: 'I', OPTION: 'EQ', PLANT_LOW: plant }] : [],
        MATERIALTYPE: materialType
      });

      return result.MATNRLIST?.map(mat => this.transformMaterial(mat)) || [];

    } else if (this.connectionType === 'ODATA') {
      let url = `/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`;

      if (materialType) {
        url += `?$filter=ProductType eq '${materialType}'`;
      }

      const result = await this.client.request(url);
      return result.d?.results?.map(prod => this.transformProductOData(prod)) || [];
    }
  }

  /**
   * Fetch Customers from SAP
   */
  async fetchCustomers(options = {}) {
    if (this.connectionType === 'RFC') {
      const result = await this.client.call('BAPI_CUSTOMER_GETLIST', {
        MAXROWS: options.limit || 1000
      });

      return result.ADDRESSDATA?.map(cust => this.transformCustomer(cust)) || [];

    } else if (this.connectionType === 'ODATA') {
      const url = `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$filter=BusinessPartnerCategory eq '1'`;
      const result = await this.client.request(url);
      return result.d?.results?.map(bp => this.transformBusinessPartner(bp)) || [];
    }
  }

  /**
   * Fetch Vendors from SAP
   */
  async fetchVendors(options = {}) {
    if (this.connectionType === 'RFC') {
      const result = await this.client.call('BAPI_VENDOR_GETLIST', {
        MAXROWS: options.limit || 1000
      });

      return result.ADDRESSDATA?.map(vend => this.transformVendor(vend)) || [];

    } else if (this.connectionType === 'ODATA') {
      const url = `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$filter=BusinessPartnerCategory eq '2'`;
      const result = await this.client.request(url);
      return result.d?.results?.map(bp => this.transformBusinessPartnerVendor(bp)) || [];
    }
  }

  // ==========================================
  // Outbound Operations (WMS -> SAP)
  // ==========================================

  /**
   * Post Goods Receipt to SAP
   */
  async sendReceiptConfirmation(receipt) {
    if (this.connectionType === 'RFC') {
      const gmItems = receipt.lines.map((line, idx) => ({
        MATERIAL: line.materialNumber,
        PLANT: this.config.defaultPlant,
        STGE_LOC: line.storageLocation || this.config.defaultStorageLocation,
        ENTRY_QNT: line.quantity,
        ENTRY_UOM: line.uom,
        PO_NUMBER: receipt.poNumber,
        PO_ITEM: line.poItem,
        MVT_IND: 'B', // Goods Movement Indicator
        MOVE_TYPE: '101' // GR for PO
      }));

      const result = await this.client.call('BAPI_GOODSMVT_CREATE', {
        GOODSMVT_HEADER: {
          PSTNG_DATE: formatSAPDate(receipt.postingDate || new Date()),
          DOC_DATE: formatSAPDate(receipt.documentDate || new Date()),
          REF_DOC_NO: receipt.referenceNumber
        },
        GOODSMVT_CODE: { GM_CODE: '01' }, // 01 = Goods Receipt
        GOODSMVT_ITEM: gmItems
      });

      if (result.RETURN?.some(r => r.TYPE === 'E')) {
        throw new Error(result.RETURN.find(r => r.TYPE === 'E').MESSAGE);
      }

      // Commit the transaction
      await this.client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

      return {
        success: true,
        materialDocument: result.MATERIALDOCUMENT,
        year: result.MATDOCUMENTYEAR
      };

    } else if (this.connectionType === 'IDOC') {
      // Send WMMBID01 IDoc for goods movement
      const idoc = this.buildGoodsMovementIDoc(receipt, '101');
      return await this.client.send(idoc);
    }
  }

  /**
   * Post Goods Issue / Shipment Confirmation to SAP
   */
  async sendShipmentConfirmation(shipment) {
    if (this.connectionType === 'RFC') {
      // For delivery-based shipments
      if (shipment.deliveryNumber) {
        const result = await this.client.call('BAPI_OUTB_DELIVERY_CONFIRM_DEC', {
          DELIVERY: shipment.deliveryNumber,
          ACTUAL_GI_DATE: formatSAPDate(shipment.shipDate)
        });

        if (result.RETURN?.some(r => r.TYPE === 'E')) {
          throw new Error(result.RETURN.find(r => r.TYPE === 'E').MESSAGE);
        }

        await this.client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

        return { success: true, delivery: shipment.deliveryNumber };
      }

      // For direct goods issue
      const gmItems = shipment.lines.map((line, idx) => ({
        MATERIAL: line.materialNumber,
        PLANT: this.config.defaultPlant,
        STGE_LOC: line.storageLocation || this.config.defaultStorageLocation,
        ENTRY_QNT: line.quantity,
        ENTRY_UOM: line.uom,
        MOVE_TYPE: '601', // GI for Sales Order
        SALES_ORD: line.salesOrder,
        S_ORD_ITEM: line.salesOrderItem
      }));

      const result = await this.client.call('BAPI_GOODSMVT_CREATE', {
        GOODSMVT_HEADER: {
          PSTNG_DATE: formatSAPDate(shipment.shipDate),
          DOC_DATE: formatSAPDate(shipment.documentDate || new Date()),
          REF_DOC_NO: shipment.referenceNumber
        },
        GOODSMVT_CODE: { GM_CODE: '03' }, // 03 = Goods Issue
        GOODSMVT_ITEM: gmItems
      });

      if (result.RETURN?.some(r => r.TYPE === 'E')) {
        throw new Error(result.RETURN.find(r => r.TYPE === 'E').MESSAGE);
      }

      await this.client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

      return {
        success: true,
        materialDocument: result.MATERIALDOCUMENT,
        year: result.MATDOCUMENTYEAR
      };

    } else if (this.connectionType === 'IDOC') {
      const idoc = this.buildGoodsMovementIDoc(shipment, '601');
      return await this.client.send(idoc);
    }
  }

  /**
   * Post Inventory Adjustment to SAP
   */
  async sendInventoryAdjustment(adjustment) {
    const moveType = adjustment.quantity > 0 ? '561' : '562'; // 561=GR Other, 562=GI Other

    if (this.connectionType === 'RFC') {
      const gmItems = [{
        MATERIAL: adjustment.materialNumber,
        PLANT: this.config.defaultPlant,
        STGE_LOC: adjustment.storageLocation || this.config.defaultStorageLocation,
        ENTRY_QNT: Math.abs(adjustment.quantity),
        ENTRY_UOM: adjustment.uom,
        MOVE_TYPE: moveType,
        MOVE_REAS: adjustment.reasonCode // Movement Reason
      }];

      const result = await this.client.call('BAPI_GOODSMVT_CREATE', {
        GOODSMVT_HEADER: {
          PSTNG_DATE: formatSAPDate(adjustment.postingDate || new Date()),
          DOC_DATE: formatSAPDate(new Date()),
          REF_DOC_NO: adjustment.referenceNumber
        },
        GOODSMVT_CODE: { GM_CODE: adjustment.quantity > 0 ? '05' : '06' },
        GOODSMVT_ITEM: gmItems
      });

      if (result.RETURN?.some(r => r.TYPE === 'E')) {
        throw new Error(result.RETURN.find(r => r.TYPE === 'E').MESSAGE);
      }

      await this.client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

      return {
        success: true,
        materialDocument: result.MATERIALDOCUMENT,
        year: result.MATDOCUMENTYEAR
      };
    }
  }

  /**
   * Send Inventory Snapshot to SAP (Physical Inventory)
   */
  async sendInventorySnapshot(inventory) {
    if (this.connectionType === 'RFC') {
      // Create Physical Inventory Document
      const result = await this.client.call('BAPI_PHYSINV_CREATE', {
        HEADER: {
          PLANT: this.config.defaultPlant,
          STGE_LOC: inventory.storageLocation,
          PHYS_INV_DATE: formatSAPDate(inventory.countDate),
          COUNT_DATE: formatSAPDate(inventory.countDate),
          POST_DATE: formatSAPDate(new Date())
        },
        ITEMS: inventory.items.map((item, idx) => ({
          MATERIAL: item.materialNumber,
          BATCH: item.batch || '',
          COUNT_QUAN: item.quantity,
          COUNT_UNIT: item.uom
        }))
      });

      if (result.RETURN?.some(r => r.TYPE === 'E')) {
        throw new Error(result.RETURN.find(r => r.TYPE === 'E').MESSAGE);
      }

      await this.client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

      return {
        success: true,
        physInvDoc: result.PHYSINVENTORY,
        year: result.FISCALYEAR
      };
    }
  }

  // ==========================================
  // IDoc Builders
  // ==========================================

  buildGoodsMovementIDoc(data, moveType) {
    return {
      IDOCTYP: 'WMMBID01',
      MESTYP: 'WMMBXY',
      SNDPRT: 'LS',
      SNDPRN: this.config.partnerNumber,
      RCVPRT: 'LS',
      RCVPRN: this.config.sapLogicalSystem,
      EDI_DC40: {
        TABNAM: 'EDI_DC40',
        IDOCTYP: 'WMMBID01',
        MESTYP: 'WMMBXY'
      },
      E1MBXYH: {
        BWART: moveType,
        BUDAT: formatSAPDate(data.postingDate || new Date()),
        BLDAT: formatSAPDate(data.documentDate || new Date()),
        XBLNR: data.referenceNumber
      },
      E1MBXYI: data.lines?.map(line => ({
        MATNR: line.materialNumber,
        WERKS: this.config.defaultPlant,
        LGORT: line.storageLocation,
        ERFMG: line.quantity,
        ERFME: line.uom
      }))
    };
  }

  // ==========================================
  // Transformers (SAP -> FlowLogic)
  // ==========================================

  transformPurchaseOrder(sapPO) {
    return {
      externalId: sapPO.PO_NUMBER,
      poNumber: sapPO.PO_NUMBER,
      vendorId: sapPO.VENDOR,
      orderDate: parseSAPDate(sapPO.DOC_DATE),
      deliveryDate: parseSAPDate(sapPO.DELIV_DATE),
      status: this.mapPOStatus(sapPO.STATUS),
      currency: sapPO.CURRENCY,
      lines: [{
        lineNumber: sapPO.PO_ITEM,
        productSku: sapPO.MATERIAL,
        quantity: parseFloat(sapPO.QUANTITY),
        uom: sapPO.PO_UNIT,
        unitPrice: parseFloat(sapPO.NET_PRICE),
        plant: sapPO.PLANT,
        storageLocation: sapPO.STGE_LOC
      }]
    };
  }

  transformPurchaseOrderOData(sapPO) {
    return {
      externalId: sapPO.PurchaseOrder,
      poNumber: sapPO.PurchaseOrder,
      vendorId: sapPO.Supplier,
      orderDate: new Date(sapPO.PurchaseOrderDate),
      status: this.mapPOStatus(sapPO.PurchasingDocumentDeletionCode),
      currency: sapPO.DocumentCurrency,
      lines: sapPO.to_PurchaseOrderItem?.results?.map(item => ({
        lineNumber: item.PurchaseOrderItem,
        productSku: item.Material,
        quantity: parseFloat(item.OrderQuantity),
        uom: item.PurchaseOrderQuantityUnit,
        unitPrice: parseFloat(item.NetPriceAmount),
        plant: item.Plant,
        storageLocation: item.StorageLocation
      })) || []
    };
  }

  transformSalesOrder(sapSO) {
    return {
      externalId: sapSO.SD_DOC,
      orderNumber: sapSO.SD_DOC,
      customerId: sapSO.SOLD_TO,
      orderDate: parseSAPDate(sapSO.DOC_DATE),
      requestedDate: parseSAPDate(sapSO.REQ_DATE_H),
      status: this.mapSOStatus(sapSO.DOC_STATUS)
    };
  }

  transformSalesOrderOData(sapSO) {
    return {
      externalId: sapSO.SalesOrder,
      orderNumber: sapSO.SalesOrder,
      customerId: sapSO.SoldToParty,
      orderDate: new Date(sapSO.SalesOrderDate),
      requestedDate: new Date(sapSO.RequestedDeliveryDate),
      status: this.mapSOStatus(sapSO.OverallDeliveryStatus),
      lines: sapSO.to_Item?.results?.map(item => ({
        lineNumber: item.SalesOrderItem,
        productSku: item.Material,
        quantity: parseFloat(item.RequestedQuantity),
        uom: item.RequestedQuantityUnit
      })) || []
    };
  }

  transformMaterial(sapMat) {
    return {
      externalId: sapMat.MATERIAL,
      sku: sapMat.MATERIAL,
      name: sapMat.MATL_DESC,
      uom: sapMat.BASE_UOM,
      materialType: sapMat.MATL_TYPE,
      grossWeight: parseFloat(sapMat.GROSS_WT),
      netWeight: parseFloat(sapMat.NET_WEIGHT),
      weightUnit: sapMat.UNIT_OF_WT
    };
  }

  transformProductOData(sapProd) {
    return {
      externalId: sapProd.Product,
      sku: sapProd.Product,
      name: sapProd.ProductDescription,
      uom: sapProd.BaseUnit,
      materialType: sapProd.ProductType,
      grossWeight: parseFloat(sapProd.GrossWeight),
      netWeight: parseFloat(sapProd.NetWeight),
      weightUnit: sapProd.WeightUnit
    };
  }

  transformCustomer(sapCust) {
    return {
      externalId: sapCust.CUSTOMER,
      code: sapCust.CUSTOMER,
      name: sapCust.NAME,
      address: sapCust.STREET,
      city: sapCust.CITY,
      state: sapCust.REGION,
      zipCode: sapCust.POSTL_COD1,
      country: sapCust.COUNTRY
    };
  }

  transformBusinessPartner(bp) {
    return {
      externalId: bp.BusinessPartner,
      code: bp.BusinessPartner,
      name: bp.BusinessPartnerFullName,
      type: 'CUSTOMER'
    };
  }

  transformVendor(sapVend) {
    return {
      externalId: sapVend.VENDOR,
      code: sapVend.VENDOR,
      name: sapVend.NAME,
      address: sapVend.STREET,
      city: sapVend.CITY,
      state: sapVend.REGION,
      zipCode: sapVend.POSTL_COD1,
      country: sapVend.COUNTRY
    };
  }

  transformBusinessPartnerVendor(bp) {
    return {
      externalId: bp.BusinessPartner,
      code: bp.BusinessPartner,
      name: bp.BusinessPartnerFullName,
      type: 'VENDOR'
    };
  }

  // Status mappers
  mapPOStatus(sapStatus) {
    const statusMap = {
      '': 'OPEN',
      'X': 'DELETED',
      'L': 'BLOCKED'
    };
    return statusMap[sapStatus] || 'OPEN';
  }

  mapSOStatus(sapStatus) {
    const statusMap = {
      'A': 'NOT_DELIVERED',
      'B': 'PARTIALLY_DELIVERED',
      'C': 'FULLY_DELIVERED'
    };
    return statusMap[sapStatus] || 'OPEN';
  }

  // ==========================================
  // Simulation Methods (for development)
  // ==========================================

  async simulateRFCCall(functionName, params) {
    // Return mock data for development/testing
    switch (functionName) {
      case 'RFC_PING':
        return { RETURN: [] };
      case 'BAPI_PO_GETITEMS':
        return { PO_ITEMS: [] };
      case 'BAPI_SALESORDER_GETLIST':
        return { SALES_ORDERS: [] };
      default:
        return { RETURN: [{ TYPE: 'S', MESSAGE: 'Success' }] };
    }
  }

  async simulateODataRequest(endpoint, method, body) {
    return { d: { results: [] } };
  }

  async simulateIDocSend(idoc) {
    return { success: true, idocNumber: `0000000${Date.now()}` };
  }

  async simulateIDocReceive(messageType) {
    return [];
  }
}

// Helper functions
function formatSAPDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function parseSAPDate(sapDate) {
  if (!sapDate || sapDate === '00000000') return null;
  return new Date(`${sapDate.slice(0, 4)}-${sapDate.slice(4, 6)}-${sapDate.slice(6, 8)}`);
}

export { formatSAPDate, parseSAPDate };
