import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

// WebSocket and file upload support
import { initializeWebSocket, WS_EVENTS, emitAlert, emitInventoryUpdate } from './lib/websocket/index.js';

// Import routes
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import locationRoutes from './routes/locations.js';
import taskRoutes from './routes/tasks.js';
import alertRoutes from './routes/alerts.js';
import dockRoutes from './routes/docks.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import receivingRoutes from './routes/receiving.js';
import shippingRoutes from './routes/shipping.js';
import cycleCountRoutes from './routes/cycleCounts.js';
import laborRoutes from './routes/labor.js';
import replenishmentRoutes from './routes/replenishment.js';
import customerRoutes from './routes/customers.js';
import vendorRoutes from './routes/vendors.js';
import userRoutes from './routes/users.js';
import carrierRoutes from './routes/carriers.js';
import warehouseRoutes from './routes/warehouses.js';
import reportRoutes from './routes/reports.js';
import palletRoutes from './routes/pallets.js';
import physicalInventoryRoutes from './routes/physicalInventory.js';
import workOrderRoutes from './routes/workOrders.js';
import rmaRoutes from './routes/rma.js';
import asnRoutes from './routes/asn.js';
import integrationRoutes from './routes/integrations.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLogs.js';
import containerRoutes from './routes/containers.js';
import appointmentRoutes from './routes/appointments.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import gateRoutes from './routes/gate.js';
import shipNoticeRoutes from './routes/shipNotices.js';

// Import auth middleware
import { optionalAuth } from './middleware/auth.js';

// Import tools for AI
import { tools, createToolExecutor } from './tools.js';

// Import middleware
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma client with reconnection support for prisma dev
let prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Helper to reconnect after prepared statement errors
async function reconnectPrisma() {
  console.log('Reconnecting Prisma client...');
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  await prisma.$connect();
  console.log('Prisma client reconnected');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Production environment validation
if (process.env.NODE_ENV === 'production') {
  // Validate required environment variables for production
  if (!process.env.ALLOWED_ORIGINS) {
    console.error('⚠️  WARNING: ALLOWED_ORIGINS not set in production. CORS may not be properly restricted.');
    console.error('   Set ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-super-secret-session-key-change-in-production') {
    console.error('⚠️  WARNING: SESSION_SECRET not properly configured for production.');
    console.error('   Generate a secure random string for SESSION_SECRET.');
  }
}

// CORS configuration - restrict in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [])
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Validate CORS in production - don't use fallback domain
if (process.env.NODE_ENV === 'production' && (!corsOptions.origin || (Array.isArray(corsOptions.origin) && corsOptions.origin.length === 0))) {
  console.error('❌ FATAL: No ALLOWED_ORIGINS configured for production. Server will not start.');
  console.error('   Set ALLOWED_ORIGINS environment variable with comma-separated domains.');
  process.exit(1);
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Swagger API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'FlowLogic WMS API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
  },
}));

// Serve OpenAPI spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Apply optional auth to all routes (user info available if logged in)
app.use(optionalAuth);

// Store conversation history per session
const conversations = new Map();

// Create tool executor with database access
const executeAction = createToolExecutor(prisma);

// System prompt for FlowLogic AI (Flow)
const SYSTEM_PROMPT = `You are Flow, the intelligent warehouse management assistant for FlowLogic WMS. You have complete visibility into all warehouse operations, real-time database access, and the ability to investigate issues, find root causes, and execute fixes.

IMPORTANT: Your name is "Flow" - you are the personal AI assistant built into the FlowLogic WMS system. Never mention Claude, Anthropic, or any underlying AI technology. You ARE Flow.

## Your Capabilities:
1. **Investigate Issues** - Analyze inventory discrepancies, shortages, overages, and their root causes
2. **Monitor Operations** - Track receiving, shipping, labor performance, and system health
3. **Execute Actions** - Adjust inventory, create tasks, send alerts, and prevent future issues
4. **Predict Problems** - Identify trends and forecast potential issues before they occur
5. **Query Database** - Access real-time data from the PostgreSQL database

## Response Guidelines:
- Be concise but thorough in your analysis
- Always cite specific data points (locations, timestamps, users, quantities)
- When finding root causes, explain the chain of events
- Suggest actionable fixes with clear impact assessments
- Use markdown formatting for clarity
- When executing actions, confirm what was done
- Speak as Flow, the warehouse assistant - be helpful, professional, and action-oriented

## Current System Context:
{SYSTEM_CONTEXT}

When users ask about issues, investigate thoroughly using the available tools and data. Provide confidence levels for your findings and always suggest next steps.`;

// Get current system context from database using $queryRawUnsafe
async function getSystemContext() {
  try {
    const inventoryCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count,
             COALESCE(SUM("quantityOnHand"), 0) as "onHand",
             COALESCE(SUM("quantityAllocated"), 0) as allocated
      FROM inventory
    `);
    const orderStats = await prisma.$queryRawUnsafe(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `);
    const alertStats = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM alerts WHERE "isResolved" = false
    `);
    const taskStats = await prisma.$queryRawUnsafe(`
      SELECT status, COUNT(*) as count FROM tasks
      WHERE status NOT IN ('COMPLETED', 'CANCELLED')
      GROUP BY status
    `);

    const inv = inventoryCount[0];
    const context = `
**Inventory Overview:**
- Total inventory records: ${Number(inv.count)}
- Total units on hand: ${Number(inv.onHand)}
- Units allocated: ${Number(inv.allocated)}

**Order Status:**
${orderStats.map(s => `- ${s.status}: ${Number(s.count)}`).join('\n')}

**Active Alerts:** ${Number(alertStats[0]?.count || 0)} unresolved

**Active Tasks:**
${taskStats.map(s => `- ${s.status}: ${Number(s.count)}`).join('\n')}

**Timestamp:** ${new Date().toISOString()}
`;
    return context;
  } catch (error) {
    console.error('Error getting system context:', error);
    return 'Database connection pending. Some features may be limited.';
  }
}

// ==========================================
// API Routes
// ==========================================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    database: dbStatus,
  });
});

// Mount API routes
app.use('/api/inventory', inventoryRoutes(prisma));
app.use('/api/orders', orderRoutes(prisma));
app.use('/api/products', productRoutes(prisma));
app.use('/api/locations', locationRoutes(prisma));
app.use('/api/tasks', taskRoutes(prisma));
app.use('/api/alerts', alertRoutes(prisma));
app.use('/api/docks', dockRoutes(prisma));
app.use('/api/chat-history', chatRoutes(prisma));
app.use('/api/auth', authRoutes(prisma));
app.use('/api/receiving', receivingRoutes(prisma));
app.use('/api/shipping', shippingRoutes(prisma));
app.use('/api/cycle-counts', cycleCountRoutes(prisma));
app.use('/api/labor', laborRoutes(prisma));
app.use('/api/replenishment', replenishmentRoutes(prisma));
app.use('/api/customers', customerRoutes(prisma));
app.use('/api/vendors', vendorRoutes(prisma));
app.use('/api/users', userRoutes(prisma));
app.use('/api/carriers', carrierRoutes(prisma));
app.use('/api/warehouses', warehouseRoutes(prisma));
app.use('/api/reports', reportRoutes(prisma));
app.use('/api/pallets', palletRoutes(prisma));
app.use('/api/physical-inventory', physicalInventoryRoutes(prisma));
app.use('/api/work-orders', workOrderRoutes(prisma));
app.use('/api/rma', rmaRoutes(prisma));
app.use('/api/asn', asnRoutes(prisma));
app.use('/api/integrations', integrationRoutes(prisma));
app.use('/api/settings', settingsRoutes(prisma));
app.use('/api/audit-logs', auditLogRoutes(prisma));
app.use('/api/containers', containerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/ship-notices', shipNoticeRoutes);

// Dashboard summary endpoint using $queryRawUnsafe to avoid prepared statement issues
app.get('/api/dashboard', async (req, res) => {
  try {
    // Use $queryRawUnsafe to avoid prepared statement caching entirely
    const inventorySummary = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM("quantityOnHand"), 0) as "totalOnHand",
        COALESCE(SUM("quantityAllocated"), 0) as "totalAllocated",
        COALESCE(SUM("quantityAvailable"), 0) as "totalAvailable"
      FROM inventory
    `);

    const orderCounts = await prisma.$queryRawUnsafe(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    const lateOrders = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE "requiredDate" < NOW()
        AND status NOT IN ('SHIPPED', 'DELIVERED', 'CANCELLED')
    `);

    const pendingTasks = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status NOT IN ('COMPLETED', 'CANCELLED')
    `);

    const unresolvedAlerts = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE "isResolved" = false
    `);

    const recentTransactions = await prisma.$queryRawUnsafe(`
      SELECT
        it.id, it.type, it.quantity, it."createdAt",
        p.sku as "productSku", p.name as "productName",
        l.code as "locationCode",
        u."fullName" as "userName"
      FROM inventory_transactions it
      LEFT JOIN products p ON it."productId" = p.id
      LEFT JOIN locations l ON it."locationId" = l.id
      LEFT JOIN users u ON it."userId" = u.id
      ORDER BY it."createdAt" DESC
      LIMIT 10
    `);

    const inv = inventorySummary[0];
    const byStatus = {};
    for (const row of orderCounts) {
      byStatus[row.status] = Number(row.count);
    }

    return res.json({
      inventory: {
        totalRecords: Number(inv.count),
        totalOnHand: Number(inv.totalOnHand),
        totalAllocated: Number(inv.totalAllocated),
        totalAvailable: Number(inv.totalAvailable),
      },
      orders: {
        byStatus,
        lateOrders: Number(lateOrders[0]?.count || 0),
      },
      tasks: {
        pending: Number(pendingTasks[0]?.count || 0),
      },
      alerts: {
        unresolved: Number(unresolvedAlerts[0]?.count || 0),
      },
      recentActivity: recentTransactions.map(t => ({
        id: t.id,
        type: t.type,
        quantity: t.quantity,
        createdAt: t.createdAt,
        product: { sku: t.productSku, name: t.productName },
        location: { code: t.locationCode },
        user: { fullName: t.userName },
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    // Return demo data if database query fails (common with prisma dev)
    return res.json({
      inventory: {
        totalRecords: 24,
        totalOnHand: 15000,
        totalAllocated: 2500,
        totalAvailable: 12500,
      },
      orders: {
        byStatus: { PENDING: 5, PROCESSING: 3, SHIPPED: 2 },
        lateOrders: 1,
      },
      tasks: {
        pending: 8,
      },
      alerts: {
        unresolved: 3,
      },
      recentActivity: [],
      _demo: true, // Flag to indicate this is demo data
    });
  }
});

// ==========================================
// AI Chat Endpoints
// ==========================================

// Main chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  const { message, sessionId = 'default', stream = true } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'AI not configured',
      message: 'Please add ANTHROPIC_API_KEY to your .env file'
    });
  }

  // Get or create conversation history
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  const history = conversations.get(sessionId);

  // Add user message to history
  history.push({ role: 'user', content: message });

  // Build system prompt with current context
  const systemContext = await getSystemContext();
  const systemPrompt = SYSTEM_PROMPT.replace('{SYSTEM_CONTEXT}', systemContext);

  try {
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: tools,
        messages: history,
        stream: true,
      });

      for await (const event of response) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
          }
        } else if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            res.write(`data: ${JSON.stringify({
              type: 'tool_start',
              tool: event.content_block.name,
              id: event.content_block.id
            })}\n\n`);
          }
        } else if (event.type === 'message_delta') {
          if (event.delta.stop_reason === 'tool_use') {
            res.write(`data: ${JSON.stringify({ type: 'tool_executing' })}\n\n`);
          }
        }
      }

      // Add assistant response to history
      history.push({ role: 'assistant', content: fullResponse });

      // Keep history manageable (last 20 messages)
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

    } else {
      // Non-streaming response
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: tools,
        messages: history,
      });

      // Handle tool use if needed
      let finalResponse = response;
      let iterations = 0;
      const maxIterations = 5;

      while (finalResponse.stop_reason === 'tool_use' && iterations < maxIterations) {
        const toolUseBlock = finalResponse.content.find(block => block.type === 'tool_use');

        if (toolUseBlock) {
          const toolResult = await executeAction(toolUseBlock.name, toolUseBlock.input);

          // Add assistant message and tool result to history
          history.push({ role: 'assistant', content: finalResponse.content });
          history.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(toolResult)
            }]
          });

          // Continue the conversation
          finalResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            tools: tools,
            messages: history,
          });
        }
        iterations++;
      }

      // Extract text from response
      const textContent = finalResponse.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      // Add to history
      history.push({ role: 'assistant', content: textContent });

      // Keep history manageable
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      res.json({
        response: textContent,
        sessionId,
        toolsUsed: finalResponse.content
          .filter(block => block.type === 'tool_use')
          .map(block => block.name)
      });
    }

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message
    });
  }
});

// Execute a specific action
app.post('/api/actions/execute', async (req, res) => {
  const { action, params } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  try {
    const result = await executeAction(action, params);
    res.json(result);
  } catch (error) {
    console.error('Action execution error:', error);
    res.status(500).json({
      error: 'Failed to execute action',
      details: error.message
    });
  }
});

// Clear conversation history
app.delete('/api/chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  conversations.delete(sessionId);
  res.json({ success: true, message: 'Conversation cleared' });
});

// ==========================================
// Warehouse & Company Endpoints
// ==========================================

app.get('/api/warehouses', async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        company: { select: { code: true, name: true } },
        _count: {
          select: {
            zones: true,
            inventory: true,
            orders: true,
          },
        },
      },
    });
    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { warehouseId, role, isActive } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (warehouseId) {
      where.warehouses = { some: { warehouseId } };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ==========================================
// Error Handling Middleware (must be last)
// ==========================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ==========================================
// Server Startup
// ==========================================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.warn('Database connection pending:', error.message);
    console.warn('Run "npx prisma db push" and "npm run db:seed" to initialize the database');
  }

  // Create HTTP server for WebSocket support
  const httpServer = createServer(app);

  // Initialize WebSocket (Socket.io)
  const io = initializeWebSocket(httpServer);
  console.log('WebSocket server initialized');

  // Make io available to routes for real-time updates
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   FlowLogic WMS Server                                        ║
║   ───────────────────────────────────────────────────────     ║
║                                                               ║
║   Server: http://localhost:${PORT}                              ║
║   API Docs: http://localhost:${PORT}/api/docs                   ║
║                                                               ║
║   Core API Routes:                                            ║
║   • /api/dashboard      - Dashboard summary                   ║
║   • /api/inventory      - Inventory management                ║
║   • /api/orders         - Order management                    ║
║   • /api/products       - Product catalog                     ║
║   • /api/locations      - Location management                 ║
║   • /api/tasks          - Task management                     ║
║   • /api/alerts         - Alert system                        ║
║   • /api/docks          - Dock scheduling & appointments      ║
║   • /api/receiving      - Inbound/PO management               ║
║   • /api/shipping       - Outbound/carrier management         ║
║   • /api/cycle-counts   - Cycle counting & adjustments        ║
║   • /api/labor          - Labor tracking & productivity       ║
║   • /api/replenishment  - Replenishment rules & tasks         ║
║   • /api/customers      - Customer management                 ║
║   • /api/vendors        - Vendor management                   ║
║   • /api/users          - User & role management              ║
║   • /api/carriers       - Carrier & services                  ║
║   • /api/warehouses     - Warehouse & zone management         ║
║   • /api/reports        - Reports & analytics                 ║
║   • /api/pallets        - Pallet management & moves           ║
║   • /api/physical-inventory - Physical inventory counts       ║
║   • /api/work-orders    - Work orders & manufacturing        ║
║   • /api/rma            - Returns & RMA processing           ║
║   • /api/asn            - Advance ship notices               ║
║   • /api/integrations   - EDI & trading partners             ║
║   • /api/settings       - System configuration               ║
║   • /api/audit-logs     - Audit trail & compliance           ║
║   • /api/containers     - Container receiving & tracking     ║
║   • /api/appointments   - Dock appointments & scheduling     ║
║   • /api/purchase-orders - PO management & analysis         ║
║   • /api/gate           - Gate in/out & compliance          ║
║   • /api/ship-notices   - ASN/Ship notice management        ║
║                                                               ║
║   AI Endpoints:                                               ║
║   • POST /api/chat      - Flow AI Assistant                   ║
║   • POST /api/actions   - Execute AI actions                  ║
║                                                               ║
║   Real-Time:                                                  ║
║   • WebSocket (Socket.io) - Real-time updates                 ║
║   • /api/uploads        - File upload endpoints               ║
║                                                               ║
║   Status:                                                     ║
║   • AI: ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not configured'}                                      ║
║   • DB: PostgreSQL (Prisma)                                   ║
║   • WS: Socket.io enabled                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
