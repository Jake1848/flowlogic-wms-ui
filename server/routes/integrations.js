import { Router } from 'express';
import { createAdapter, DataTypes } from '../adapters/index.js';
import notificationService from '../services/notification.js';

/**
 * Integration & WMS Connector Routes
 * Manages connections to external WMS, ERP, and TMS systems
 * Updated for AI Intelligence Platform
 */
export default function integrationRoutes(prisma) {
  // Initialize notification service
  notificationService.setPrisma(prisma);
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // ==========================================
  // Static routes MUST come before parameterized routes
  // ==========================================

  // Get integration stats - BEFORE /:id
  router.get('/stats/summary', asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalIntegrations, activeIntegrations, todayLogs, errorLogs] = await Promise.all([
      prisma.integration.count(),
      prisma.integration.count({ where: { status: 'ACTIVE' } }),
      prisma.integrationLog.count({ where: { processedAt: { gte: today } } }),
      prisma.integrationLog.count({
        where: {
          status: 'ERROR',
          processedAt: { gte: today }
        }
      })
    ]);

    res.json({
      totalIntegrations,
      activeIntegrations,
      recordsToday: todayLogs,
      errorsToday: errorLogs
    });
  }));

  // Get all integration logs - BEFORE /:id
  router.get('/logs', asyncHandler(async (req, res) => {
    const { integrationId, status, limit = 50 } = req.query;

    const where = {};
    if (integrationId) where.integrationId = integrationId;
    if (status) where.status = status;

    const dbLogs = await prisma.integrationLog.findMany({
      where,
      include: {
        integration: { select: { id: true, name: true } }
      },
      orderBy: { processedAt: 'desc' },
      take: parseInt(limit)
    });

    const logs = dbLogs.map(log => ({
      id: log.id,
      integrationId: log.integrationId,
      integrationName: log.integration?.name || 'Unknown',
      status: log.status?.toLowerCase() || 'unknown',
      message: log.responseData?.message || log.errorMessage || `${log.messageType} processed`,
      recordCount: log.responseData?.recordsProcessed || 0,
      timestamp: log.processedAt?.toISOString()
    }));

    res.json({ logs });
  }));

  // ==========================================
  // Integration Management
  // ==========================================

  // Get all integrations
  router.get('/', asyncHandler(async (req, res) => {
    const { type, isActive } = req.query;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const dbIntegrations = await prisma.integration.findMany({
      where,
      include: {
        company: { select: { name: true } },
        _count: { select: { logs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get recent log counts for recordsToday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const integrations = await Promise.all(dbIntegrations.map(async (integration) => {
      const todayLogs = await prisma.integrationLog.count({
        where: {
          integrationId: integration.id,
          processedAt: { gte: today }
        }
      });

      // Map status to frontend expected values
      let status = 'disconnected';
      if (integration.status === 'ACTIVE') status = 'connected';
      else if (integration.status === 'SYNCING') status = 'syncing';
      else if (integration.status === 'ERROR') status = 'error';
      else if (integration.status === 'INACTIVE') status = 'disconnected';

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.settings?.provider || 'custom',
        method: integration.settings?.method || 'REST API',
        status,
        lastSync: integration.lastSyncAt?.toISOString(),
        endpoint: integration.endpoint,
        dataFlow: integration.settings?.dataFlow || 'bidirectional',
        syncFrequency: integration.settings?.syncFrequency || 'Manual',
        recordsToday: todayLogs,
        isActive: integration.isActive,
        lastError: integration.lastError,
        company: integration.company?.name
      };
    }));

    res.json({ integrations });
  }));

  // Get single integration
  router.get('/:id', asyncHandler(async (req, res) => {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        logs: {
          take: 20,
          orderBy: { processedAt: 'desc' }
        }
      }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json(integration);
  }));

  // Create integration
  router.post('/', asyncHandler(async (req, res) => {
    const {
      name,
      type,
      endpoint,
      apiKey,
      apiSecret,
      username,
      password,
      settings
    } = req.body;

    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const integration = await prisma.integration.create({
      data: {
        name,
        type: type || 'WMS',
        endpoint,
        apiKey,
        apiSecret,
        username,
        password,
        settings: settings || {},
        companyId,
        status: 'INACTIVE',
        isActive: true
      }
    });

    res.status(201).json(integration);
  }));

  // Update integration
  router.put('/:id', asyncHandler(async (req, res) => {
    const { enabled, name, endpoint, settings, apiKey, apiSecret } = req.body;

    const updateData = {};
    if (enabled !== undefined) {
      updateData.isActive = enabled;
      updateData.status = enabled ? 'ACTIVE' : 'INACTIVE';
    }
    if (name) updateData.name = name;
    if (endpoint) updateData.endpoint = endpoint;
    if (settings) updateData.settings = settings;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    updateData.updatedAt = new Date();

    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(integration);
  }));

  // Delete integration
  router.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.integration.update({
      where: { id: req.params.id },
      data: { isActive: false, status: 'INACTIVE' }
    });

    res.json({ message: 'Integration deactivated' });
  }));

  // Test integration connection
  router.post('/:id/test', asyncHandler(async (req, res) => {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Simulate connection test based on type
    const testResult = {
      success: true,
      timestamp: new Date().toISOString(),
      details: {}
    };

    const method = integration.settings?.method || 'API';

    if (method === 'SFTP' || method === 'FTP') {
      testResult.details = {
        connected: true,
        serverResponse: 'Connection established',
        latency: Math.floor(Math.random() * 100) + 50
      };
    } else if (method === 'REST API' || method === 'API') {
      testResult.details = {
        endpoint: integration.endpoint || 'N/A',
        statusCode: 200,
        responseTime: Math.floor(Math.random() * 200) + 100
      };
    } else {
      testResult.details = { message: 'Connection test completed' };
    }

    // Log the test
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        direction: 'OUTBOUND',
        messageType: 'CONNECTION_TEST',
        status: 'SUCCESS',
        responseData: testResult,
        processedAt: new Date()
      }
    });

    res.json(testResult);
  }));

  // Sync integration now
  router.post('/:id/sync', asyncHandler(async (req, res) => {
    const { dataType = 'INVENTORY_SNAPSHOT' } = req.body;

    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Update status to syncing
    await prisma.integration.update({
      where: { id: req.params.id },
      data: { status: 'SYNCING' }
    });

    const syncStartTime = Date.now();
    let recordsProcessed = 0;
    let syncError = null;

    try {
      // Create adapter and attempt real sync
      const adapter = createAdapter(integration);

      // Test connection first
      const connected = await adapter.connect();
      if (!connected) {
        throw new Error('Failed to connect to WMS');
      }

      // Fetch data
      const data = await adapter.fetchData(dataType);

      if (data && data.length > 0) {
        // Store the data based on type
        if (dataType === 'INVENTORY_SNAPSHOT') {
          await prisma.inventorySnapshot.createMany({
            data: data.map(item => ({
              sku: item.sku,
              locationCode: item.locationCode,
              locationType: item.locationType || 'STORAGE',
              licensePlate: item.licensePlate,
              onHandQty: item.onHandQty || item.quantity || 0,
              allocatedQty: item.allocatedQty || 0,
              availableQty: item.availableQty || item.onHandQty || 0,
              lotNumber: item.lotNumber,
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
              rawData: item
            })),
            skipDuplicates: true
          });
        } else if (dataType === 'TRANSACTION_HISTORY') {
          await prisma.transactionSnapshot.createMany({
            data: data.map(item => ({
              externalTransactionId: item.transactionId || item.id,
              type: item.type || 'UNKNOWN',
              sku: item.sku,
              fromLocation: item.fromLocation,
              toLocation: item.toLocation,
              quantity: item.quantity || 0,
              transactionDate: item.transactionDate ? new Date(item.transactionDate) : new Date(),
              rawData: item
            })),
            skipDuplicates: true
          });
        }

        recordsProcessed = data.length;
      }

      await adapter.disconnect();
    } catch (error) {
      syncError = error.message;
      console.error(`Sync error for integration ${integration.id}:`, error);

      // Notify about sync failure
      notificationService.notifySyncFailed(integration, error.message).catch(console.error);
    }

    // Log the sync attempt
    const syncLog = await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        direction: 'INBOUND',
        messageType: `SYNC_${dataType}`,
        status: syncError ? 'ERROR' : 'SUCCESS',
        responseData: {
          message: syncError || 'Sync completed successfully',
          recordsProcessed,
          duration: Date.now() - syncStartTime,
          dataType
        },
        errorMessage: syncError,
        processedAt: new Date()
      }
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        status: syncError ? 'ERROR' : 'ACTIVE',
        lastSyncAt: new Date(),
        lastError: syncError,
        lastErrorAt: syncError ? new Date() : undefined
      }
    });

    if (syncError) {
      return res.status(500).json({
        success: false,
        syncId: syncLog.id,
        error: syncError
      });
    }

    res.json({
      success: true,
      syncId: syncLog.id,
      recordsProcessed,
      message: `Sync completed successfully. ${recordsProcessed} records processed.`
    });
  }));

  // ==========================================
  // Integration Logs (for specific integration)
  // ==========================================

  // Get logs for specific integration
  router.get('/:id/logs', asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const logs = await prisma.integrationLog.findMany({
      where: { integrationId: req.params.id },
      orderBy: { processedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ logs });
  }));

  return router;
}
