/**
 * FlowLogic WMS Connector Routes
 *
 * Provides endpoints for:
 * - Testing WMS connections
 * - Syncing data from WMS systems
 * - Managing adapter configurations
 * - Real-time data fetching
 */

import { Router } from 'express';
import { createAdapter, getAllAdapterTypes, getAdapterMetadata, DataTypes } from '../adapters/index.js';

// Cache for active adapter instances
const adapterCache = new Map();

/**
 * Get or create adapter instance for an integration
 */
async function getAdapter(prisma, integrationId) {
  // Check cache first
  if (adapterCache.has(integrationId)) {
    return adapterCache.get(integrationId);
  }

  // Fetch integration from database
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId }
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  // Create adapter
  const adapter = createAdapter(integration);

  // Cache it
  adapterCache.set(integrationId, adapter);

  return adapter;
}

/**
 * Clear adapter from cache
 */
function clearAdapterCache(integrationId) {
  adapterCache.delete(integrationId);
}

/**
 * Create connector routes
 */
export default function connectorRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // ==========================================
  // Adapter Information
  // ==========================================

  /**
   * Get all available adapter types with metadata
   */
  router.get('/types', (req, res) => {
    const types = getAllAdapterTypes();
    res.json({ types });
  });

  /**
   * Get metadata for specific adapter type
   */
  router.get('/types/:type', (req, res) => {
    const metadata = getAdapterMetadata(req.params.type);
    res.json(metadata);
  });

  /**
   * Get supported data types
   */
  router.get('/data-types', (req, res) => {
    res.json({
      dataTypes: Object.entries(DataTypes).map(([key, value]) => ({
        key,
        value,
        description: getDataTypeDescription(value)
      }))
    });
  });

  // ==========================================
  // Connection Management
  // ==========================================

  /**
   * Test connection for an integration
   */
  router.post('/:integrationId/test', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;

    // Clear cache to ensure fresh connection
    clearAdapterCache(integrationId);

    const adapter = await getAdapter(prisma, integrationId);
    const result = await adapter.testConnection();

    // Log the test
    await prisma.integrationLog.create({
      data: {
        integrationId,
        direction: 'OUTBOUND',
        messageType: 'CONNECTION_TEST',
        status: result.success ? 'SUCCESS' : 'ERROR',
        responseData: result,
        errorMessage: result.success ? null : result.message,
        processedAt: new Date()
      }
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: result.success ? 'ACTIVE' : 'ERROR',
        lastError: result.success ? null : result.message,
        lastErrorAt: result.success ? null : new Date()
      }
    });

    res.json(result);
  }));

  /**
   * Get adapter status
   */
  router.get('/:integrationId/status', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;

    const adapter = await getAdapter(prisma, integrationId);
    const metadata = adapter.getMetadata();

    res.json({
      integrationId,
      ...metadata
    });
  }));

  // ==========================================
  // Data Sync Operations
  // ==========================================

  /**
   * Sync specific data type from WMS
   */
  router.post('/:integrationId/sync/:dataType', asyncHandler(async (req, res) => {
    const { integrationId, dataType } = req.params;
    const { dateFrom, dateTo, limit, offset, ...otherOptions } = req.body;

    const adapter = await getAdapter(prisma, integrationId);

    // Update status to syncing
    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: 'SYNCING' }
    });

    // Build options
    const options = {
      ...otherOptions,
      limit: limit || 1000,
      offset: offset || 0
    };

    if (dateFrom) options.dateFrom = new Date(dateFrom);
    if (dateTo) options.dateTo = new Date(dateTo);

    // Perform sync
    const syncResult = await adapter.sync(dataType, options);

    // Log the sync
    await prisma.integrationLog.create({
      data: {
        integrationId,
        direction: 'INBOUND',
        messageType: `SYNC_${dataType.toUpperCase()}`,
        status: syncResult.success ? 'SUCCESS' : 'ERROR',
        responseData: {
          dataType,
          rawCount: syncResult.rawCount,
          transformedCount: syncResult.transformedCount,
          syncTime: syncResult.syncTime
        },
        errorMessage: syncResult.error,
        processedAt: new Date()
      }
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: syncResult.success ? 'ACTIVE' : 'ERROR',
        lastSyncAt: syncResult.success ? new Date() : undefined,
        lastError: syncResult.error,
        lastErrorAt: syncResult.success ? null : new Date()
      }
    });

    // If successful, store the data
    if (syncResult.success && syncResult.data.length > 0) {
      await storeIngestedData(prisma, integrationId, dataType, syncResult.data);
    }

    res.json(syncResult);
  }));

  /**
   * Sync all supported data types
   */
  router.post('/:integrationId/sync-all', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;
    const { dataTypes, dateFrom, dateTo } = req.body;

    const adapter = await getAdapter(prisma, integrationId);
    const supportedTypes = adapter.getSupportedDataTypes();

    // Use specified types or all supported types
    const typesToSync = dataTypes || supportedTypes;

    const results = [];

    for (const dataType of typesToSync) {
      if (!supportedTypes.includes(dataType)) {
        results.push({
          dataType,
          success: false,
          error: `Data type not supported: ${dataType}`
        });
        continue;
      }

      const options = {};
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      const syncResult = await adapter.sync(dataType, options);
      results.push({
        dataType,
        ...syncResult
      });

      // Store successful syncs
      if (syncResult.success && syncResult.data.length > 0) {
        await storeIngestedData(prisma, integrationId, dataType, syncResult.data);
      }
    }

    // Update integration
    const hasErrors = results.some(r => !r.success);
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: hasErrors ? 'ERROR' : 'ACTIVE',
        lastSyncAt: new Date()
      }
    });

    res.json({
      integrationId,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  }));

  /**
   * Fetch data without storing (preview)
   */
  router.post('/:integrationId/preview/:dataType', asyncHandler(async (req, res) => {
    const { integrationId, dataType } = req.params;
    const { limit = 10, ...options } = req.body;

    const adapter = await getAdapter(prisma, integrationId);

    // Ensure authenticated
    await adapter.refreshAuthIfNeeded();

    // Fetch data
    const fetchResult = await adapter.fetchData(dataType, { ...options, limit });

    if (!fetchResult.success) {
      return res.status(400).json({ error: fetchResult.error });
    }

    // Transform sample
    const transformed = adapter.transformData(dataType, fetchResult.data);

    res.json({
      raw: fetchResult.data.slice(0, 5),
      transformed: transformed.slice(0, 5),
      totalFetched: fetchResult.count,
      hasMore: fetchResult.hasMore
    });
  }));

  // ==========================================
  // Field Mapping
  // ==========================================

  /**
   * Get current field mappings for integration
   */
  router.get('/:integrationId/mappings', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    const settings = integration?.settings || {};

    res.json({
      fieldMappings: settings.fieldMappings || {},
      dataPath: settings.dataPath,
      endpoints: settings.endpoints
    });
  }));

  /**
   * Update field mappings for integration
   */
  router.put('/:integrationId/mappings', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;
    const { fieldMappings, dataPath, endpoints } = req.body;

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    const currentSettings = integration?.settings || {};

    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        settings: {
          ...currentSettings,
          ...(fieldMappings && { fieldMappings }),
          ...(dataPath && { dataPath }),
          ...(endpoints && { endpoints })
        }
      }
    });

    // Clear adapter cache to reload settings
    clearAdapterCache(integrationId);

    res.json({ success: true, message: 'Mappings updated' });
  }));

  // ==========================================
  // Scheduled Sync
  // ==========================================

  /**
   * Create scheduled sync job
   */
  router.post('/:integrationId/schedule', asyncHandler(async (req, res) => {
    const { integrationId } = req.params;
    const { schedule, dataTypes, name } = req.body;

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const scheduledJob = await prisma.scheduledIngestion.create({
      data: {
        name: name || `${integration.name} Sync`,
        source: integration.id,
        connectionConfig: JSON.stringify({ integrationId, dataTypes }),
        schedule, // cron expression
        dataType: (dataTypes || []).join(','),
        mappingType: integration.type,
        isActive: true,
        nextRunAt: getNextRunDate(schedule)
      }
    });

    res.json({ success: true, job: scheduledJob });
  }));

  return router;
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Store ingested data in appropriate tables
 */
async function storeIngestedData(prisma, integrationId, dataType, data) {
  // Create ingestion record
  const ingestion = await prisma.dataIngestion.create({
    data: {
      filename: `sync_${integrationId}_${dataType}`,
      filePath: 'api_sync',
      dataType,
      source: integrationId,
      mappingType: 'api',
      recordCount: data.length,
      status: 'COMPLETED',
      metadata: { syncType: 'api' }
    }
  });

  const batchSize = 500;

  switch (dataType) {
    case DataTypes.INVENTORY_SNAPSHOT:
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await prisma.inventorySnapshot.createMany({
          data: batch.map(r => ({
            ingestionId: ingestion.id,
            sku: r.sku,
            locationCode: r.locationCode,
            quantityOnHand: r.quantityOnHand || 0,
            quantityAllocated: r.quantityAllocated || 0,
            quantityAvailable: r.quantityAvailable || 0,
            lotNumber: r.lotNumber,
            expirationDate: r.expirationDate,
            snapshotDate: new Date(),
            rawData: r.rawData || r
          })),
          skipDuplicates: true
        });
      }
      break;

    case DataTypes.TRANSACTION_HISTORY:
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await prisma.transactionSnapshot.createMany({
          data: batch.map(r => ({
            ingestionId: ingestion.id,
            externalTransactionId: r.transactionId,
            type: r.type,
            sku: r.sku,
            fromLocation: r.fromLocation,
            toLocation: r.toLocation,
            quantity: r.quantity || 0,
            userId: r.userId,
            transactionDate: r.transactionDate || new Date(),
            rawData: r.rawData || r
          })),
          skipDuplicates: true
        });
      }
      break;

    case DataTypes.ADJUSTMENT_LOG:
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await prisma.adjustmentSnapshot.createMany({
          data: batch.map(r => ({
            ingestionId: ingestion.id,
            sku: r.sku,
            locationCode: r.locationCode,
            adjustmentQty: r.adjustmentQty || 0,
            reason: r.reason || 'Unknown',
            reasonCode: r.reasonCode,
            userId: r.userId,
            adjustmentDate: r.adjustmentDate || new Date(),
            rawData: r.rawData || r
          })),
          skipDuplicates: true
        });
      }
      break;

    case DataTypes.CYCLE_COUNT_RESULTS:
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await prisma.cycleCountSnapshot.createMany({
          data: batch.map(r => ({
            ingestionId: ingestion.id,
            sku: r.sku,
            locationCode: r.locationCode,
            systemQty: r.systemQty || 0,
            countedQty: r.countedQty || 0,
            variance: r.variance || 0,
            variancePercent: r.variancePercent || 0,
            counterId: r.counterId,
            countDate: r.countDate || new Date(),
            rawData: r.rawData || r
          })),
          skipDuplicates: true
        });
      }
      break;
  }

  // Update ingestion as completed
  await prisma.dataIngestion.update({
    where: { id: ingestion.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  return ingestion;
}

/**
 * Get description for data type
 */
function getDataTypeDescription(dataType) {
  const descriptions = {
    [DataTypes.INVENTORY_SNAPSHOT]: 'Current inventory levels by SKU and location',
    [DataTypes.TRANSACTION_HISTORY]: 'Historical inventory movements and transactions',
    [DataTypes.ADJUSTMENT_LOG]: 'Inventory adjustment records with reasons',
    [DataTypes.CYCLE_COUNT_RESULTS]: 'Physical count vs system quantity comparisons',
    [DataTypes.ORDER_STATUS]: 'Order fulfillment status and details',
    [DataTypes.LOCATION_MASTER]: 'Warehouse location definitions',
    [DataTypes.SKU_MASTER]: 'Product/SKU master data'
  };
  return descriptions[dataType] || 'WMS data';
}

/**
 * Calculate next run date from cron expression
 */
function getNextRunDate(cronExpression) {
  // Simple implementation - in production use a cron parser library
  const now = new Date();
  // Default to next hour
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export { connectorRoutes };
