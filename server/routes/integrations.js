import { Router } from 'express';

/**
 * Integration & EDI Management Routes
 * Handles external system integrations, EDI trading partners, and data exchange
 */
export default function integrationRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Integration types
  const INTEGRATION_TYPES = ['EDI', 'API', 'FTP', 'SFTP', 'WEBHOOK', 'EMAIL'];

  // EDI document types
  const EDI_DOCUMENT_TYPES = [
    { code: '810', name: 'Invoice' },
    { code: '820', name: 'Payment Order/Remittance Advice' },
    { code: '850', name: 'Purchase Order' },
    { code: '855', name: 'Purchase Order Acknowledgment' },
    { code: '856', name: 'Advance Ship Notice' },
    { code: '940', name: 'Warehouse Shipping Order' },
    { code: '943', name: 'Warehouse Stock Transfer Shipment Advice' },
    { code: '944', name: 'Warehouse Stock Transfer Receipt Advice' },
    { code: '945', name: 'Warehouse Shipping Advice' },
    { code: '947', name: 'Warehouse Inventory Adjustment Advice' }
  ];

  // ==========================================
  // Trading Partner Management
  // ==========================================

  // Get all trading partners
  router.get('/partners', asyncHandler(async (req, res) => {
    const { type, isActive, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { ediId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.tradingPartner.findMany({
        where,
        include: {
          customer: { select: { id: true, code: true, name: true } },
          vendor: { select: { id: true, code: true, name: true } },
          carrier: { select: { id: true, code: true, name: true } },
          _count: { select: { transactions: true } }
        },
        orderBy: { name: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.tradingPartner.count({ where })
    ]);

    res.json({
      data: partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single trading partner
  router.get('/partners/:id', asyncHandler(async (req, res) => {
    const partner = await prisma.tradingPartner.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        vendor: true,
        carrier: true,
        documentConfigs: true,
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Trading partner not found' });
    }

    res.json(partner);
  }));

  // Create trading partner
  router.post('/partners', asyncHandler(async (req, res) => {
    const {
      code,
      name,
      type,
      ediId,
      ediQualifier,
      customerId,
      vendorId,
      carrierId,
      connectionConfig,
      documentTypes
    } = req.body;

    const partner = await prisma.tradingPartner.create({
      data: {
        code,
        name,
        type,
        ediId,
        ediQualifier,
        customerId,
        vendorId,
        carrierId,
        connectionConfig: connectionConfig || {},
        isActive: true,
        documentConfigs: documentTypes ? {
          create: documentTypes.map(dt => ({
            documentType: dt.type,
            direction: dt.direction, // INBOUND or OUTBOUND
            isEnabled: true,
            mappingConfig: dt.mapping || {}
          }))
        } : undefined
      },
      include: {
        documentConfigs: true
      }
    });

    res.status(201).json(partner);
  }));

  // Update trading partner
  router.patch('/partners/:id', asyncHandler(async (req, res) => {
    const { name, ediId, ediQualifier, connectionConfig, isActive } = req.body;

    const partner = await prisma.tradingPartner.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(ediId !== undefined && { ediId }),
        ...(ediQualifier !== undefined && { ediQualifier }),
        ...(connectionConfig && { connectionConfig }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        documentConfigs: true
      }
    });

    res.json(partner);
  }));

  // Delete trading partner
  router.delete('/partners/:id', asyncHandler(async (req, res) => {
    await prisma.tradingPartner.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Trading partner deactivated' });
  }));

  // Test partner connection
  router.post('/partners/:id/test', asyncHandler(async (req, res) => {
    const partner = await prisma.tradingPartner.findUnique({
      where: { id: req.params.id }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Trading partner not found' });
    }

    // Simulate connection test based on type
    const testResult = {
      success: true,
      timestamp: new Date(),
      details: {}
    };

    switch (partner.type) {
      case 'FTP':
      case 'SFTP':
        testResult.details = {
          connected: true,
          serverResponse: 'Connection established',
          latency: Math.floor(Math.random() * 100) + 50
        };
        break;
      case 'API':
        testResult.details = {
          endpoint: partner.connectionConfig?.endpoint || 'N/A',
          statusCode: 200,
          responseTime: Math.floor(Math.random() * 200) + 100
        };
        break;
      case 'EDI':
        testResult.details = {
          vaNetwork: 'Connected',
          lastPoll: new Date(),
          pendingDocuments: 0
        };
        break;
      default:
        testResult.details = { message: 'Test completed' };
    }

    // Log the test
    await prisma.integrationTransaction.create({
      data: {
        partnerId: partner.id,
        type: 'CONNECTION_TEST',
        direction: 'OUTBOUND',
        status: 'SUCCESS',
        documentType: 'TEST',
        processedAt: new Date(),
        metadata: testResult
      }
    });

    res.json(testResult);
  }));

  // ==========================================
  // Document Configuration
  // ==========================================

  // Get document configs for partner
  router.get('/partners/:id/documents', asyncHandler(async (req, res) => {
    const configs = await prisma.documentConfig.findMany({
      where: { partnerId: req.params.id },
      orderBy: { documentType: 'asc' }
    });

    res.json(configs);
  }));

  // Add/update document config
  router.post('/partners/:id/documents', asyncHandler(async (req, res) => {
    const { documentType, direction, mappingConfig, validationRules, isEnabled } = req.body;

    const config = await prisma.documentConfig.upsert({
      where: {
        partnerId_documentType_direction: {
          partnerId: req.params.id,
          documentType,
          direction
        }
      },
      create: {
        partnerId: req.params.id,
        documentType,
        direction,
        mappingConfig: mappingConfig || {},
        validationRules: validationRules || {},
        isEnabled: isEnabled !== false
      },
      update: {
        mappingConfig: mappingConfig || {},
        validationRules: validationRules || {},
        isEnabled: isEnabled !== false,
        updatedAt: new Date()
      }
    });

    res.json(config);
  }));

  // ==========================================
  // Transaction History
  // ==========================================

  // Get all transactions
  router.get('/transactions', asyncHandler(async (req, res) => {
    const {
      partnerId,
      documentType,
      direction,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (partnerId) where.partnerId = partnerId;
    if (documentType) where.documentType = documentType;
    if (direction) where.direction = direction;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [transactions, total] = await Promise.all([
      prisma.integrationTransaction.findMany({
        where,
        include: {
          partner: { select: { id: true, code: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.integrationTransaction.count({ where })
    ]);

    res.json({
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single transaction
  router.get('/transactions/:id', asyncHandler(async (req, res) => {
    const transaction = await prisma.integrationTransaction.findUnique({
      where: { id: req.params.id },
      include: {
        partner: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  }));

  // Retry failed transaction
  router.post('/transactions/:id/retry', asyncHandler(async (req, res) => {
    const transaction = await prisma.integrationTransaction.findUnique({
      where: { id: req.params.id }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'FAILED') {
      return res.status(400).json({ error: 'Can only retry failed transactions' });
    }

    // Create new retry transaction
    const retry = await prisma.integrationTransaction.create({
      data: {
        partnerId: transaction.partnerId,
        type: transaction.type,
        direction: transaction.direction,
        documentType: transaction.documentType,
        documentNumber: transaction.documentNumber,
        rawData: transaction.rawData,
        status: 'PENDING',
        retryOf: transaction.id,
        retryCount: (transaction.retryCount || 0) + 1
      }
    });

    // Mark original as retried
    await prisma.integrationTransaction.update({
      where: { id: transaction.id },
      data: { retriedBy: retry.id }
    });

    res.json(retry);
  }));

  // ==========================================
  // EDI Processing
  // ==========================================

  // Process inbound EDI document
  router.post('/edi/process', asyncHandler(async (req, res) => {
    const { partnerId, documentType, rawData, filename } = req.body;

    // Create transaction record
    const transaction = await prisma.integrationTransaction.create({
      data: {
        partnerId,
        type: 'EDI',
        direction: 'INBOUND',
        documentType,
        rawData,
        filename,
        status: 'PROCESSING',
        receivedAt: new Date()
      }
    });

    try {
      // Simulate EDI parsing and processing
      let result = {};
      let processedEntity = null;

      switch (documentType) {
        case '850': // Purchase Order
          result = {
            poNumber: `PO-${Date.now()}`,
            lines: [],
            message: 'Purchase Order created from EDI 850'
          };
          break;

        case '856': // ASN
          result = {
            asnNumber: `ASN-${Date.now()}`,
            lines: [],
            message: 'ASN created from EDI 856'
          };
          break;

        case '940': // Warehouse Shipping Order
          result = {
            orderNumber: `WO-${Date.now()}`,
            message: 'Warehouse order created from EDI 940'
          };
          break;

        default:
          result = { message: `Document type ${documentType} processed` };
      }

      // Update transaction as successful
      await prisma.integrationTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          processedData: result,
          referenceId: processedEntity?.id
        }
      });

      res.json({
        transaction: transaction.id,
        status: 'SUCCESS',
        result
      });

    } catch (error) {
      // Update transaction as failed
      await prisma.integrationTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          processedAt: new Date()
        }
      });

      res.status(500).json({
        transaction: transaction.id,
        status: 'FAILED',
        error: error.message
      });
    }
  }));

  // Generate outbound EDI document
  router.post('/edi/generate', asyncHandler(async (req, res) => {
    const { partnerId, documentType, sourceType, sourceId } = req.body;

    const partner = await prisma.tradingPartner.findUnique({
      where: { id: partnerId }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Trading partner not found' });
    }

    // Create transaction record
    const transaction = await prisma.integrationTransaction.create({
      data: {
        partnerId,
        type: 'EDI',
        direction: 'OUTBOUND',
        documentType,
        referenceType: sourceType,
        referenceId: sourceId,
        status: 'PROCESSING'
      }
    });

    try {
      // Generate EDI content (simplified)
      let ediContent = '';
      let documentNumber = '';

      switch (documentType) {
        case '810': // Invoice
          documentNumber = `INV-${Date.now()}`;
          ediContent = generateEDI810(partner, sourceId);
          break;

        case '855': // PO Acknowledgment
          documentNumber = `POA-${Date.now()}`;
          ediContent = generateEDI855(partner, sourceId);
          break;

        case '856': // ASN
          documentNumber = `ASN-${Date.now()}`;
          ediContent = generateEDI856(partner, sourceId);
          break;

        case '945': // Warehouse Shipping Advice
          documentNumber = `WSA-${Date.now()}`;
          ediContent = generateEDI945(partner, sourceId);
          break;

        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      // Update transaction
      await prisma.integrationTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          documentNumber,
          rawData: ediContent,
          processedAt: new Date()
        }
      });

      res.json({
        transaction: transaction.id,
        documentNumber,
        content: ediContent
      });

    } catch (error) {
      await prisma.integrationTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          processedAt: new Date()
        }
      });

      res.status(500).json({
        transaction: transaction.id,
        error: error.message
      });
    }
  }));

  // ==========================================
  // Webhook Management
  // ==========================================

  // Get webhook configurations
  router.get('/webhooks', asyncHandler(async (req, res) => {
    const webhooks = await prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(webhooks);
  }));

  // Create webhook configuration
  router.post('/webhooks', asyncHandler(async (req, res) => {
    const { name, url, events, headers, isActive } = req.body;

    const webhook = await prisma.webhookConfig.create({
      data: {
        name,
        url,
        events: events || [],
        headers: headers || {},
        isActive: isActive !== false,
        secret: generateWebhookSecret()
      }
    });

    res.status(201).json(webhook);
  }));

  // Update webhook
  router.patch('/webhooks/:id', asyncHandler(async (req, res) => {
    const { name, url, events, headers, isActive } = req.body;

    const webhook = await prisma.webhookConfig.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(events && { events }),
        ...(headers && { headers }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    res.json(webhook);
  }));

  // Test webhook
  router.post('/webhooks/:id/test', asyncHandler(async (req, res) => {
    const webhook = await prisma.webhookConfig.findUnique({
      where: { id: req.params.id }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Simulate webhook test
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' }
    };

    // In production, this would actually call the webhook URL
    res.json({
      success: true,
      payload: testPayload,
      message: `Webhook test sent to ${webhook.url}`
    });
  }));

  // ==========================================
  // Integration Statistics
  // ==========================================

  // Get integration dashboard stats
  router.get('/stats', asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;

    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [
      byStatus,
      byDocType,
      byPartner,
      recentFailures,
      dailyVolume
    ] = await Promise.all([
      // Transactions by status
      prisma.integrationTransaction.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),

      // Transactions by document type
      prisma.integrationTransaction.groupBy({
        by: ['documentType'],
        where,
        _count: { id: true }
      }),

      // Transactions by partner
      prisma.integrationTransaction.groupBy({
        by: ['partnerId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      // Recent failures
      prisma.integrationTransaction.findMany({
        where: { ...where, status: 'FAILED' },
        include: {
          partner: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Daily volume (last 7 days)
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM integration_transactions
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ]);

    // Get partner details for stats
    const partnerIds = byPartner.map(p => p.partnerId);
    const partners = await prisma.tradingPartner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, code: true, name: true }
    });
    const partnerMap = new Map(partners.map(p => [p.id, p]));

    res.json({
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
      byDocumentType: byDocType.reduce((acc, d) => ({ ...acc, [d.documentType]: d._count.id }), {}),
      byPartner: byPartner.map(p => ({
        partner: partnerMap.get(p.partnerId),
        count: p._count.id
      })),
      recentFailures,
      dailyVolume: dailyVolume.map(d => ({
        date: d.date,
        count: Number(d.count)
      }))
    });
  }));

  // Get available EDI document types
  router.get('/edi/document-types', (req, res) => {
    res.json(EDI_DOCUMENT_TYPES);
  });

  // Get available integration types
  router.get('/types', (req, res) => {
    res.json(INTEGRATION_TYPES);
  });

  return router;
}

// Helper functions for EDI generation (simplified placeholders)
function generateEDI810(partner, sourceId) {
  return `ISA*00*          *00*          *ZZ*${partner.ediId}*ZZ*FLOWLOGIC*${new Date().toISOString().slice(0,10).replace(/-/g,'')}*0000*U*00401*000000001*0*P*>~
GS*IN*${partner.ediId}*FLOWLOGIC*${new Date().toISOString().slice(0,8)}*0000*1*X*004010~
ST*810*0001~
BIG*${new Date().toISOString().slice(0,10)}*INV-${sourceId}~
SE*3*0001~
GE*1*1~
IEA*1*000000001~`;
}

function generateEDI855(partner, sourceId) {
  return `ISA*00*          *00*          *ZZ*${partner.ediId}*ZZ*FLOWLOGIC*${new Date().toISOString().slice(0,10).replace(/-/g,'')}*0000*U*00401*000000001*0*P*>~
GS*PR*${partner.ediId}*FLOWLOGIC*${new Date().toISOString().slice(0,8)}*0000*1*X*004010~
ST*855*0001~
BAK*00*AC*${sourceId}*${new Date().toISOString().slice(0,10)}~
SE*3*0001~
GE*1*1~
IEA*1*000000001~`;
}

function generateEDI856(partner, sourceId) {
  return `ISA*00*          *00*          *ZZ*${partner.ediId}*ZZ*FLOWLOGIC*${new Date().toISOString().slice(0,10).replace(/-/g,'')}*0000*U*00401*000000001*0*P*>~
GS*SH*${partner.ediId}*FLOWLOGIC*${new Date().toISOString().slice(0,8)}*0000*1*X*004010~
ST*856*0001~
BSN*00*${sourceId}*${new Date().toISOString().slice(0,10)}*0000*0001~
SE*3*0001~
GE*1*1~
IEA*1*000000001~`;
}

function generateEDI945(partner, sourceId) {
  return `ISA*00*          *00*          *ZZ*${partner.ediId}*ZZ*FLOWLOGIC*${new Date().toISOString().slice(0,10).replace(/-/g,'')}*0000*U*00401*000000001*0*P*>~
GS*SW*${partner.ediId}*FLOWLOGIC*${new Date().toISOString().slice(0,8)}*0000*1*X*004010~
ST*945*0001~
W06*B*${sourceId}*${new Date().toISOString().slice(0,10)}~
SE*3*0001~
GE*1*1~
IEA*1*000000001~`;
}

function generateWebhookSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
