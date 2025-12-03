/**
 * Base ERP Adapter
 * Abstract base class for all ERP system integrations
 */

export class BaseERPAdapter {
  constructor(config) {
    this.config = config;
    this.name = 'Base ERP';
    this.connected = false;
    this.lastSync = null;
    this.errorCount = 0;
  }

  /**
   * Connect to the ERP system
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Disconnect from the ERP system
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Test connection to ERP
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      name: this.name,
      connected: this.connected,
      lastSync: this.lastSync,
      errorCount: this.errorCount
    };
  }

  // ==========================================
  // Inbound Operations (ERP -> WMS)
  // ==========================================

  /**
   * Fetch purchase orders from ERP
   */
  async fetchPurchaseOrders(options = {}) {
    throw new Error('fetchPurchaseOrders() must be implemented by subclass');
  }

  /**
   * Fetch sales orders from ERP
   */
  async fetchSalesOrders(options = {}) {
    throw new Error('fetchSalesOrders() must be implemented by subclass');
  }

  /**
   * Fetch products/items from ERP
   */
  async fetchProducts(options = {}) {
    throw new Error('fetchProducts() must be implemented by subclass');
  }

  /**
   * Fetch customers from ERP
   */
  async fetchCustomers(options = {}) {
    throw new Error('fetchCustomers() must be implemented by subclass');
  }

  /**
   * Fetch vendors/suppliers from ERP
   */
  async fetchVendors(options = {}) {
    throw new Error('fetchVendors() must be implemented by subclass');
  }

  // ==========================================
  // Outbound Operations (WMS -> ERP)
  // ==========================================

  /**
   * Send shipment confirmation to ERP
   */
  async sendShipmentConfirmation(shipment) {
    throw new Error('sendShipmentConfirmation() must be implemented by subclass');
  }

  /**
   * Send receipt confirmation to ERP
   */
  async sendReceiptConfirmation(receipt) {
    throw new Error('sendReceiptConfirmation() must be implemented by subclass');
  }

  /**
   * Send inventory adjustment to ERP
   */
  async sendInventoryAdjustment(adjustment) {
    throw new Error('sendInventoryAdjustment() must be implemented by subclass');
  }

  /**
   * Send inventory snapshot to ERP
   */
  async sendInventorySnapshot(inventory) {
    throw new Error('sendInventorySnapshot() must be implemented by subclass');
  }

  /**
   * Send ASN to ERP
   */
  async sendASN(asn) {
    throw new Error('sendASN() must be implemented by subclass');
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Transform ERP data to FlowLogic format
   */
  transformToFlowLogic(erpData, entityType) {
    throw new Error('transformToFlowLogic() must be implemented by subclass');
  }

  /**
   * Transform FlowLogic data to ERP format
   */
  transformToERP(flowLogicData, entityType) {
    throw new Error('transformToERP() must be implemented by subclass');
  }

  /**
   * Log integration activity
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.name}] ${message}`, data);
  }

  /**
   * Handle error with retry logic
   */
  async withRetry(operation, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.errorCount++;
        this.log('warn', `Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Batch process items with rate limiting
   */
  async processBatch(items, processor, batchSize = 100, delayMs = 100) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);

      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
