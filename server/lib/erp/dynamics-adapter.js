/**
 * Microsoft Dynamics ERP Adapter
 * Integration with Dynamics 365 Finance & Operations, Business Central, and GP
 */

import { BaseERPAdapter } from './base-adapter.js';

export class DynamicsAdapter extends BaseERPAdapter {
  constructor(config) {
    super(config);
    this.name = 'Microsoft Dynamics';
    this.erpType = config.erpType || 'F&O'; // F&O, BC, GP
    this.client = null;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Connect to Dynamics
   */
  async connect() {
    this.log('info', `Connecting to Dynamics ${this.erpType}...`);

    try {
      switch (this.erpType) {
        case 'F&O':
          await this.connectFO();
          break;
        case 'BC':
          await this.connectBC();
          break;
        case 'GP':
          await this.connectGP();
          break;
        default:
          throw new Error(`Unknown Dynamics ERP type: ${this.erpType}`);
      }

      this.connected = true;
      this.log('info', 'Connected to Dynamics successfully');
    } catch (error) {
      this.log('error', 'Dynamics connection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Connect to Dynamics 365 Finance & Operations
   */
  async connectFO() {
    // Get OAuth token from Azure AD
    await this.getAzureToken();

    const baseUrl = this.config.foUrl; // e.g., https://company.operations.dynamics.com

    this.client = {
      type: 'F&O',
      baseUrl,
      dataUrl: `${baseUrl}/data`,
      apiUrl: `${baseUrl}/api`,
      request: async (endpoint, method = 'GET', body = null) => {
        await this.ensureToken();

        const url = endpoint.startsWith('http') ? endpoint : `${this.client.dataUrl}${endpoint}`;

        this.log('debug', `F&O ${method}: ${endpoint}`);
        return this.simulateFORequest(endpoint, method, body);
      }
    };
  }

  /**
   * Connect to Dynamics 365 Business Central
   */
  async connectBC() {
    await this.getAzureToken();

    const baseUrl = this.config.bcUrl; // e.g., https://api.businesscentral.dynamics.com/v2.0/{tenant}/{environment}

    this.client = {
      type: 'BC',
      baseUrl,
      companyId: this.config.companyId,
      request: async (endpoint, method = 'GET', body = null) => {
        await this.ensureToken();

        const url = endpoint.startsWith('http')
          ? endpoint
          : `${this.client.baseUrl}/companies(${this.client.companyId})${endpoint}`;

        this.log('debug', `BC ${method}: ${endpoint}`);
        return this.simulateBCRequest(endpoint, method, body);
      }
    };
  }

  /**
   * Connect to Dynamics GP
   */
  async connectGP() {
    const baseUrl = this.config.gpUrl; // GP Web Services or eConnect URL

    this.client = {
      type: 'GP',
      baseUrl,
      companyId: this.config.companyId || 1,
      request: async (endpoint, method = 'GET', body = null) => {
        this.log('debug', `GP ${method}: ${endpoint}`);
        return this.simulateGPRequest(endpoint, method, body);
      }
    };
  }

  /**
   * Get Azure AD OAuth token
   */
  async getAzureToken() {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    // In production, use actual HTTP client
    // const response = await fetch(tokenUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'client_credentials',
    //     client_id: this.config.clientId,
    //     client_secret: this.config.clientSecret,
    //     scope: this.config.scope
    //   })
    // });
    // const data = await response.json();
    // this.accessToken = data.access_token;
    // this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    // Simulated token
    this.accessToken = 'simulated-azure-token';
    this.tokenExpiry = Date.now() + 3600000; // 1 hour
  }

  async ensureToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.getAzureToken();
    }
  }

  async disconnect() {
    this.connected = false;
    this.client = null;
    this.accessToken = null;
    this.log('info', 'Disconnected from Dynamics');
  }

  async testConnection() {
    try {
      if (this.erpType === 'F&O') {
        await this.client.request('/Companies');
      } else if (this.erpType === 'BC') {
        await this.client.request('/companies');
      } else if (this.erpType === 'GP') {
        await this.client.request('/Company');
      }
      return { success: true, message: 'Dynamics connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // Inbound Operations (Dynamics -> WMS)
  // ==========================================

  /**
   * Fetch Purchase Orders from Dynamics
   */
  async fetchPurchaseOrders(options = {}) {
    const { fromDate, toDate, status, company } = options;

    if (this.erpType === 'F&O') {
      let url = '/PurchaseOrderHeadersV2';
      const filters = [];

      if (fromDate) filters.push(`OrderDate ge ${formatODataDate(fromDate)}`);
      if (toDate) filters.push(`OrderDate le ${formatODataDate(toDate)}`);
      if (status) filters.push(`PurchaseOrderStatus eq '${status}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=PurchaseOrderLines`;
      }

      const result = await this.client.request(url);
      return result.value?.map(po => this.transformFOPurchaseOrder(po)) || [];

    } else if (this.erpType === 'BC') {
      let url = '/purchaseOrders';
      const filters = [];

      if (fromDate) filters.push(`orderDate ge ${formatODataDate(fromDate)}`);
      if (status) filters.push(`status eq '${status}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=purchaseOrderLines`;
      }

      const result = await this.client.request(url);
      return result.value?.map(po => this.transformBCPurchaseOrder(po)) || [];

    } else if (this.erpType === 'GP') {
      const result = await this.client.request('/PurchaseOrder/GetList', 'POST', {
        companyId: this.client.companyId,
        fromDate,
        toDate
      });
      return result.PurchaseOrders?.map(po => this.transformGPPurchaseOrder(po)) || [];
    }
  }

  /**
   * Fetch Sales Orders from Dynamics
   */
  async fetchSalesOrders(options = {}) {
    const { fromDate, toDate, status } = options;

    if (this.erpType === 'F&O') {
      let url = '/SalesOrderHeadersV2';
      const filters = [];

      if (fromDate) filters.push(`OrderCreatedDateTime ge ${formatODataDate(fromDate)}`);
      if (status) filters.push(`SalesOrderStatus eq '${status}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=SalesOrderLines`;
      }

      const result = await this.client.request(url);
      return result.value?.map(so => this.transformFOSalesOrder(so)) || [];

    } else if (this.erpType === 'BC') {
      let url = '/salesOrders';
      const filters = [];

      if (fromDate) filters.push(`orderDate ge ${formatODataDate(fromDate)}`);
      if (status) filters.push(`status eq '${status}'`);

      if (filters.length > 0) {
        url += `?$filter=${filters.join(' and ')}&$expand=salesOrderLines`;
      }

      const result = await this.client.request(url);
      return result.value?.map(so => this.transformBCSalesOrder(so)) || [];

    } else if (this.erpType === 'GP') {
      const result = await this.client.request('/SalesOrder/GetList', 'POST', {
        companyId: this.client.companyId,
        fromDate,
        toDate
      });
      return result.SalesOrders?.map(so => this.transformGPSalesOrder(so)) || [];
    }
  }

  /**
   * Fetch Items from Dynamics
   */
  async fetchProducts(options = {}) {
    const { changedSince, itemGroup } = options;

    if (this.erpType === 'F&O') {
      let url = '/ReleasedProductsV2';

      if (itemGroup) {
        url += `?$filter=ItemModelGroupId eq '${itemGroup}'`;
      }

      const result = await this.client.request(url);
      return result.value?.map(item => this.transformFOItem(item)) || [];

    } else if (this.erpType === 'BC') {
      const url = '/items';
      const result = await this.client.request(url);
      return result.value?.map(item => this.transformBCItem(item)) || [];

    } else if (this.erpType === 'GP') {
      const result = await this.client.request('/Item/GetList', 'POST', {
        companyId: this.client.companyId
      });
      return result.Items?.map(item => this.transformGPItem(item)) || [];
    }
  }

  /**
   * Fetch Customers from Dynamics
   */
  async fetchCustomers(options = {}) {
    if (this.erpType === 'F&O') {
      const result = await this.client.request('/CustomersV3');
      return result.value?.map(cust => this.transformFOCustomer(cust)) || [];

    } else if (this.erpType === 'BC') {
      const result = await this.client.request('/customers');
      return result.value?.map(cust => this.transformBCCustomer(cust)) || [];

    } else if (this.erpType === 'GP') {
      const result = await this.client.request('/Customer/GetList', 'POST', {
        companyId: this.client.companyId
      });
      return result.Customers?.map(cust => this.transformGPCustomer(cust)) || [];
    }
  }

  /**
   * Fetch Vendors from Dynamics
   */
  async fetchVendors(options = {}) {
    if (this.erpType === 'F&O') {
      const result = await this.client.request('/VendorsV2');
      return result.value?.map(vend => this.transformFOVendor(vend)) || [];

    } else if (this.erpType === 'BC') {
      const result = await this.client.request('/vendors');
      return result.value?.map(vend => this.transformBCVendor(vend)) || [];

    } else if (this.erpType === 'GP') {
      const result = await this.client.request('/Vendor/GetList', 'POST', {
        companyId: this.client.companyId
      });
      return result.Vendors?.map(vend => this.transformGPVendor(vend)) || [];
    }
  }

  // ==========================================
  // Outbound Operations (WMS -> Dynamics)
  // ==========================================

  /**
   * Post Receipt to Dynamics
   */
  async sendReceiptConfirmation(receipt) {
    if (this.erpType === 'F&O') {
      const payload = {
        JournalNameId: this.config.receiptJournalName || 'WMSReceipt',
        dataAreaId: this.config.dataAreaId,
        ProductReceiptHeader: {
          PurchaseOrderNumber: receipt.poNumber,
          ProductReceiptNumber: receipt.receiptNumber,
          AccountingDate: formatODataDate(receipt.receiptDate),
          ProductReceiptLines: receipt.lines.map(line => ({
            ItemNumber: line.itemNumber,
            ReceivingQuantity: line.quantity,
            PurchaseUnitSymbol: line.uom,
            PurchaseOrderLineNumber: line.lineNumber
          }))
        }
      };

      const result = await this.client.request('/ProductReceipts', 'POST', payload);
      return { success: true, receiptId: result.ProductReceiptNumber };

    } else if (this.erpType === 'BC') {
      const payload = {
        purchaseOrderId: receipt.poId,
        vendorInvoiceNo: receipt.receiptNumber,
        postingDate: formatODataDate(receipt.receiptDate),
        purchaseReceiptLines: receipt.lines.map(line => ({
          lineNo: line.lineNumber,
          itemNo: line.itemNumber,
          quantity: line.quantity,
          unitOfMeasureCode: line.uom
        }))
      };

      const result = await this.client.request('/purchaseReceipts', 'POST', payload);
      return { success: true, receiptId: result.id };

    } else if (this.erpType === 'GP') {
      const payload = {
        companyId: this.client.companyId,
        PONumber: receipt.poNumber,
        ReceiptNumber: receipt.receiptNumber,
        ReceiptDate: receipt.receiptDate,
        Lines: receipt.lines.map(line => ({
          POLineNumber: line.lineNumber,
          ItemNumber: line.itemNumber,
          Quantity: line.quantity,
          UOM: line.uom
        }))
      };

      const result = await this.client.request('/PurchaseReceipt/Create', 'POST', payload);
      return { success: true, receiptId: result.ReceiptNumber };
    }
  }

  /**
   * Post Shipment to Dynamics
   */
  async sendShipmentConfirmation(shipment) {
    if (this.erpType === 'F&O') {
      const payload = {
        SalesOrderNumber: shipment.orderNumber,
        DeliveryName: shipment.shipmentNumber,
        ConfirmedShipDate: formatODataDate(shipment.shipDate),
        ShipCarrierId: shipment.carrierId,
        WayBillId: shipment.bolNumber,
        TrackingNumber: shipment.trackingNumber,
        dataAreaId: this.config.dataAreaId,
        Lines: shipment.lines.map(line => ({
          ItemNumber: line.itemNumber,
          DeliveryQuantity: line.quantity,
          SalesUnitSymbol: line.uom
        }))
      };

      const result = await this.client.request('/SalesOrderPostPackingSlip', 'POST', payload);
      return { success: true, packingSlipId: result.PackingSlipId };

    } else if (this.erpType === 'BC') {
      const payload = {
        salesOrderId: shipment.orderId,
        shipmentNo: shipment.shipmentNumber,
        postingDate: formatODataDate(shipment.shipDate),
        shipmentLines: shipment.lines.map(line => ({
          lineNo: line.lineNumber,
          itemNo: line.itemNumber,
          quantity: line.quantity
        }))
      };

      const result = await this.client.request('/salesShipments', 'POST', payload);
      return { success: true, shipmentId: result.id };

    } else if (this.erpType === 'GP') {
      const payload = {
        companyId: this.client.companyId,
        SOPNumber: shipment.orderNumber,
        ShipmentNumber: shipment.shipmentNumber,
        ShipDate: shipment.shipDate,
        TrackingNumber: shipment.trackingNumber,
        Lines: shipment.lines.map(line => ({
          ItemNumber: line.itemNumber,
          Quantity: line.quantity
        }))
      };

      const result = await this.client.request('/SalesShipment/Create', 'POST', payload);
      return { success: true, shipmentId: result.ShipmentNumber };
    }
  }

  /**
   * Post Inventory Adjustment to Dynamics
   */
  async sendInventoryAdjustment(adjustment) {
    if (this.erpType === 'F&O') {
      const payload = {
        JournalNameId: this.config.adjustmentJournalName || 'WMSAdj',
        dataAreaId: this.config.dataAreaId,
        InventoryAdjustmentJournalLines: [{
          ItemNumber: adjustment.itemNumber,
          InventorySiteId: adjustment.siteId || this.config.defaultSiteId,
          InventoryWarehouseId: adjustment.warehouseId || this.config.defaultWarehouseId,
          InventoryLocationId: adjustment.locationId,
          AdjustmentQuantity: adjustment.quantity,
          InventoryUnitSymbol: adjustment.uom
        }]
      };

      const result = await this.client.request('/InventoryAdjustmentJournals', 'POST', payload);
      return { success: true, journalId: result.JournalBatchNumber };

    } else if (this.erpType === 'BC') {
      const payload = {
        itemNo: adjustment.itemNumber,
        locationCode: adjustment.locationId,
        quantity: adjustment.quantity,
        postingDate: formatODataDate(new Date()),
        documentNo: adjustment.referenceNumber
      };

      const result = await this.client.request('/itemJournals', 'POST', payload);
      return { success: true, journalId: result.id };

    } else if (this.erpType === 'GP') {
      const payload = {
        companyId: this.client.companyId,
        ItemNumber: adjustment.itemNumber,
        Location: adjustment.locationId,
        Quantity: adjustment.quantity,
        ReasonCode: adjustment.reasonCode
      };

      const result = await this.client.request('/InventoryAdjustment/Create', 'POST', payload);
      return { success: true, adjustmentId: result.TransactionId };
    }
  }

  // ==========================================
  // Transformers (Dynamics -> FlowLogic)
  // ==========================================

  // F&O Transformers
  transformFOPurchaseOrder(dPO) {
    return {
      externalId: dPO.PurchaseOrderNumber,
      poNumber: dPO.PurchaseOrderNumber,
      vendorId: dPO.OrderVendorAccountNumber,
      vendorName: dPO.VendorName,
      orderDate: new Date(dPO.OrderDate),
      status: dPO.PurchaseOrderStatus,
      currency: dPO.CurrencyCode,
      lines: dPO.PurchaseOrderLines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        description: line.ProductName,
        quantity: parseFloat(line.OrderedPurchaseQuantity),
        uom: line.PurchaseUnitSymbol,
        unitPrice: parseFloat(line.PurchasePrice)
      })) || []
    };
  }

  transformFOSalesOrder(dSO) {
    return {
      externalId: dSO.SalesOrderNumber,
      orderNumber: dSO.SalesOrderNumber,
      customerId: dSO.OrderingCustomerAccountNumber,
      customerName: dSO.CustomerName,
      orderDate: new Date(dSO.OrderCreatedDateTime),
      requestedDate: new Date(dSO.RequestedShipDate),
      status: dSO.SalesOrderStatus,
      lines: dSO.SalesOrderLines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        description: line.ProductName,
        quantity: parseFloat(line.OrderedSalesQuantity),
        uom: line.SalesUnitSymbol,
        unitPrice: parseFloat(line.SalesPrice)
      })) || []
    };
  }

  transformFOItem(dItem) {
    return {
      externalId: dItem.ItemNumber,
      sku: dItem.ItemNumber,
      name: dItem.ProductName,
      description: dItem.SearchName,
      uom: dItem.SalesUnitSymbol,
      weight: parseFloat(dItem.GrossWeight) || 0,
      weightUnit: dItem.GrossWeightUnit
    };
  }

  transformFOCustomer(dCust) {
    return {
      externalId: dCust.CustomerAccount,
      code: dCust.CustomerAccount,
      name: dCust.CustomerName,
      currency: dCust.CurrencyCode
    };
  }

  transformFOVendor(dVend) {
    return {
      externalId: dVend.VendorAccountNumber,
      code: dVend.VendorAccountNumber,
      name: dVend.VendorName,
      currency: dVend.CurrencyCode
    };
  }

  // BC Transformers
  transformBCPurchaseOrder(bcPO) {
    return {
      externalId: bcPO.id,
      poNumber: bcPO.number,
      vendorId: bcPO.vendorId,
      vendorName: bcPO.vendorName,
      orderDate: new Date(bcPO.orderDate),
      status: bcPO.status,
      currency: bcPO.currencyCode,
      lines: bcPO.purchaseOrderLines?.map(line => ({
        lineNumber: line.sequence,
        productSku: line.itemId,
        description: line.description,
        quantity: parseFloat(line.quantity),
        uom: line.unitOfMeasureCode,
        unitPrice: parseFloat(line.directUnitCost)
      })) || []
    };
  }

  transformBCSalesOrder(bcSO) {
    return {
      externalId: bcSO.id,
      orderNumber: bcSO.number,
      customerId: bcSO.customerId,
      customerName: bcSO.customerName,
      orderDate: new Date(bcSO.orderDate),
      requestedDate: new Date(bcSO.requestedDeliveryDate),
      status: bcSO.status,
      lines: bcSO.salesOrderLines?.map(line => ({
        lineNumber: line.sequence,
        productSku: line.itemId,
        description: line.description,
        quantity: parseFloat(line.quantity),
        uom: line.unitOfMeasureCode,
        unitPrice: parseFloat(line.unitPrice)
      })) || []
    };
  }

  transformBCItem(bcItem) {
    return {
      externalId: bcItem.id,
      sku: bcItem.number,
      name: bcItem.displayName,
      description: bcItem.description,
      uom: bcItem.baseUnitOfMeasureCode,
      unitPrice: parseFloat(bcItem.unitPrice) || 0
    };
  }

  transformBCCustomer(bcCust) {
    return {
      externalId: bcCust.id,
      code: bcCust.number,
      name: bcCust.displayName,
      email: bcCust.email,
      phone: bcCust.phoneNumber
    };
  }

  transformBCVendor(bcVend) {
    return {
      externalId: bcVend.id,
      code: bcVend.number,
      name: bcVend.displayName,
      email: bcVend.email,
      phone: bcVend.phoneNumber
    };
  }

  // GP Transformers
  transformGPPurchaseOrder(gpPO) {
    return {
      externalId: gpPO.PONumber,
      poNumber: gpPO.PONumber,
      vendorId: gpPO.VendorId,
      orderDate: new Date(gpPO.PODate),
      status: gpPO.POStatus,
      lines: gpPO.Lines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        quantity: parseFloat(line.Quantity),
        uom: line.UOM,
        unitPrice: parseFloat(line.UnitCost)
      })) || []
    };
  }

  transformGPSalesOrder(gpSO) {
    return {
      externalId: gpSO.SOPNumber,
      orderNumber: gpSO.SOPNumber,
      customerId: gpSO.CustomerNumber,
      orderDate: new Date(gpSO.DocumentDate),
      status: gpSO.SOPStatus,
      lines: gpSO.Lines?.map(line => ({
        lineNumber: line.LineNumber,
        productSku: line.ItemNumber,
        quantity: parseFloat(line.Quantity),
        uom: line.UOM,
        unitPrice: parseFloat(line.UnitPrice)
      })) || []
    };
  }

  transformGPItem(gpItem) {
    return {
      externalId: gpItem.ItemNumber,
      sku: gpItem.ItemNumber,
      name: gpItem.ItemDescription,
      uom: gpItem.BaseUOM
    };
  }

  transformGPCustomer(gpCust) {
    return {
      externalId: gpCust.CustomerNumber,
      code: gpCust.CustomerNumber,
      name: gpCust.CustomerName
    };
  }

  transformGPVendor(gpVend) {
    return {
      externalId: gpVend.VendorId,
      code: gpVend.VendorId,
      name: gpVend.VendorName
    };
  }

  // ==========================================
  // Simulation Methods
  // ==========================================

  async simulateFORequest(endpoint, method, body) {
    return { value: [] };
  }

  async simulateBCRequest(endpoint, method, body) {
    return { value: [] };
  }

  async simulateGPRequest(endpoint, method, body) {
    return {};
  }
}

// Helper functions
function formatODataDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString();
}

export { formatODataDate };
