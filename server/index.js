import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createServer } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

// WebSocket and file upload support
import { initializeWebSocket, WS_EVENTS, emitAlert, emitInventoryUpdate } from './lib/websocket/index.js';

// Import routes - AI Intelligence Platform Core
import alertRoutes from './routes/alerts.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import integrationRoutes from './routes/integrations.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLogs.js';
import intelligenceRoutes from './routes/intelligence.js';
import aiRoutes from './routes/ai.js';
import connectorRoutes from './routes/connectors.js';
import billingRoutes from './routes/billing.js';

// Import auth middleware
import { authMiddleware, optionalAuth } from './middleware/auth.js';

// Import tools for AI
import { tools, createToolExecutor } from './tools.js';

// Import middleware
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';

// Import services
import schedulerService from './services/scheduler.js';
import ofbizSync from './services/ofbizSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway/reverse proxy (needed for rate limiting)
app.set('trust proxy', 1);

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

// Production environment validation - fail fast for missing required config
if (process.env.NODE_ENV === 'production') {
  const missingVars = [];

  if (!process.env.ALLOWED_ORIGINS) {
    missingVars.push('ALLOWED_ORIGINS');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-super-secret-session-key-change-in-production') {
    missingVars.push('SESSION_SECRET');
  }

  if (missingVars.length > 0) {
    console.error('❌ FATAL: Missing required environment variables for production:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nGenerate secrets with: openssl rand -hex 32');
    process.exit(1);
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

// Security headers - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for API docs
}));

// Compression for responses
app.use(compression());

// Rate limiting - different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth attempts per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  message: { error: 'AI rate limit exceeded, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting
app.use(generalLimiter);

// Request logging in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
}

app.use(express.json({ limit: '10mb' }));

// Make prisma and anthropic available to routes
app.locals.prisma = prisma;
app.locals.anthropic = anthropic;

// CSRF Protection - Validate Origin header for state-changing requests
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const customHeader = req.get('X-Requested-With');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

    // Check Origin header first
    if (origin) {
      if (!allowedOrigins.includes(origin)) {
        console.warn(`CSRF: Blocked request from origin ${origin}`);
        return res.status(403).json({ error: 'Forbidden', message: 'Invalid origin' });
      }
      return next();
    }

    // Fall back to Referer header
    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (!allowedOrigins.includes(refererOrigin)) {
          console.warn(`CSRF: Blocked request from referer ${refererOrigin}`);
          return res.status(403).json({ error: 'Forbidden', message: 'Invalid referer' });
        }
        return next();
      } catch {
        return res.status(403).json({ error: 'Forbidden', message: 'Invalid referer format' });
      }
    }

    // For requests without Origin/Referer, require custom header
    // This prevents CSRF from simple HTML forms while allowing API clients
    if (customHeader === 'FlowLogic') {
      return next();
    }

    console.warn('CSRF: Blocked request without Origin/Referer/X-Requested-With');
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Missing required headers. Include Origin or X-Requested-With: FlowLogic'
    });
  });
}

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

// Get current system context from database using parameterized queries
async function getSystemContext() {
  try {
    const alertStats = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM alerts WHERE "isResolved" = false
    `;
    const discrepancyStats = await prisma.$queryRaw`
      SELECT severity, COUNT(*) as count FROM discrepancies
      WHERE status = 'OPEN'
      GROUP BY severity
    `;
    const actionStats = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count FROM action_recommendations
      GROUP BY status
    `;
    const integrationStats = await prisma.$queryRaw`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active
      FROM integrations
    `;

    const context = `
**Active Alerts:** ${Number(alertStats[0]?.count || 0)} unresolved

**Open Discrepancies:**
${discrepancyStats.map(s => `- ${s.severity}: ${Number(s.count)}`).join('\n') || '- None detected'}

**Action Recommendations:**
${actionStats.map(s => `- ${s.status}: ${Number(s.count)}`).join('\n') || '- None pending'}

**Integrations:** ${Number(integrationStats[0]?.active || 0)} active of ${Number(integrationStats[0]?.total || 0)} total

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
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    database: dbStatus,
  });
});

// OFBiz test endpoint - for testing local OFBiz installations
app.post('/api/test-ofbiz', async (req, res) => {
  const { baseUrl, username, password, facilityId } = req.body;

  if (!baseUrl || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: baseUrl, username, password'
    });
  }

  try {
    // Import the OFBiz adapter dynamically
    const { OFBizAdapter } = await import('./adapters/ofbiz.js');

    const adapter = new OFBizAdapter({
      baseUrl,
      username,
      password,
      facilityId: facilityId || 'WebStoreWarehouse'
    });

    const result = await adapter.testConnection();

    if (result.success) {
      // Also try to fetch some sample data
      try {
        const inventory = await adapter.fetchInventory();
        const facilities = await adapter.fetchFacilities();

        res.json({
          success: true,
          message: 'Connected to OFBiz successfully!',
          data: {
            inventoryItems: inventory.length,
            facilities: facilities.length,
            sampleInventory: inventory.slice(0, 5),
            sampleFacilities: facilities
          }
        });
      } catch (dataError) {
        res.json({
          success: true,
          message: 'Connected to OFBiz but could not fetch data',
          warning: dataError.message
        });
      }
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `OFBiz connection failed: ${error.message}`
    });
  }
});

// OFBiz Auto-Sync endpoints
app.get('/api/ofbiz/sync/status', authMiddleware, (req, res) => {
  res.json(ofbizSync.getSyncStatus());
});

app.post('/api/ofbiz/sync', authMiddleware, async (req, res) => {
  try {
    const result = await ofbizSync.syncOFBizData(prisma);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ofbiz/sync/start-auto', authMiddleware, (req, res) => {
  const { intervalMinutes = 5 } = req.body;
  ofbizSync.startAutoSync(prisma, intervalMinutes);
  res.json({ success: true, message: `Auto-sync started (every ${intervalMinutes} minutes)` });
});

app.post('/api/ofbiz/sync/stop-auto', authMiddleware, (req, res) => {
  ofbizSync.stopAutoSync();
  res.json({ success: true, message: 'Auto-sync stopped' });
});

// Mount API routes - AI Intelligence Platform
// Public routes (no authentication required)
app.use('/api/auth', authLimiter, authRoutes(prisma));

// Protected routes (authentication required) - Core AI Platform
app.use('/api/alerts', authMiddleware, alertRoutes(prisma));
app.use('/api/chat-history', authMiddleware, chatRoutes(prisma));
app.use('/api/users', authMiddleware, userRoutes(prisma));
app.use('/api/integrations', authMiddleware, integrationRoutes(prisma));
app.use('/api/connectors', authMiddleware, connectorRoutes(prisma));
app.use('/api/billing', authMiddleware, billingRoutes(prisma));
app.use('/api/settings', authMiddleware, settingsRoutes(prisma));
app.use('/api/audit-logs', authMiddleware, auditLogRoutes(prisma));

// FlowLogic Intelligence Platform routes (protected)
app.use('/api/intelligence', authMiddleware, intelligenceRoutes(prisma));

// AI Engine routes (protected)
app.use('/api/ai', authMiddleware, aiRoutes);

// Dashboard summary endpoint - AI Intelligence Platform metrics (protected)
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    // AI Intelligence Platform metrics
    const unresolvedAlerts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM alerts WHERE "isResolved" = false
    `;

    const discrepancyStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open
      FROM discrepancies
    `;

    const actionStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
      FROM action_recommendations
    `;

    const integrationStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active
      FROM integrations
    `;

    const recentDiscrepancies = await prisma.$queryRaw`
      SELECT id, type, severity, status, sku, "locationCode", variance, "detectedAt"
      FROM discrepancies
      ORDER BY "detectedAt" DESC
      LIMIT 5
    `;

    const disc = discrepancyStats[0] || {};
    const actions = actionStats[0] || {};
    const integrations = integrationStats[0] || {};

    return res.json({
      alerts: {
        unresolved: Number(unresolvedAlerts[0]?.count || 0),
      },
      discrepancies: {
        total: Number(disc.total || 0),
        critical: Number(disc.critical || 0),
        open: Number(disc.open || 0),
      },
      actions: {
        total: Number(actions.total || 0),
        pending: Number(actions.pending || 0),
        completed: Number(actions.completed || 0),
      },
      integrations: {
        total: Number(integrations.total || 0),
        active: Number(integrations.active || 0),
      },
      recentDiscrepancies: recentDiscrepancies.map(d => ({
        id: d.id,
        type: d.type,
        severity: d.severity,
        status: d.status,
        sku: d.sku,
        locationCode: d.locationCode,
        variance: d.variance,
        detectedAt: d.detectedAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    // Return demo data if database query fails
    return res.json({
      alerts: { unresolved: 0 },
      discrepancies: { total: 0, critical: 0, open: 0 },
      actions: { total: 0, pending: 0, completed: 0 },
      integrations: { total: 0, active: 0 },
      recentDiscrepancies: [],
      _demo: true,
    });
  }
});

// ==========================================
// AI Chat Endpoints
// ==========================================

// Main chat endpoint with streaming (protected)
app.post('/api/chat', authMiddleware, aiLimiter, async (req, res) => {
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
app.post('/api/actions/execute', authMiddleware, async (req, res) => {
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
app.delete('/api/chat/:sessionId', authMiddleware, (req, res) => {
  const { sessionId } = req.params;
  conversations.delete(sessionId);
  res.json({ success: true, message: 'Conversation cleared' });
});

// ==========================================
// Warehouse & Company Endpoints (Reference Data)
// ==========================================

app.get('/api/warehouses', authMiddleware, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        company: { select: { code: true, name: true } },
        _count: {
          select: {
            zones: true,
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

// ==========================================
// Static File Serving (Frontend)
// ==========================================
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ==========================================
// Error Handling Middleware (must be last)
// ==========================================

// 404 handler for undefined API routes
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

    // Initialize scheduler service
    schedulerService.initialize(prisma);
    if (process.env.NODE_ENV === 'production') {
      schedulerService.start();
      console.log('Scheduler service started');
    }
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
║   FlowLogic AI Intelligence Platform                          ║
║   ───────────────────────────────────────────────────────     ║
║                                                               ║
║   Server: http://localhost:${PORT}                              ║
║   API Docs: http://localhost:${PORT}/api/docs                   ║
║                                                               ║
║   Core API Routes:                                            ║
║   • /api/dashboard      - AI Dashboard metrics                ║
║   • /api/alerts         - Alert system                        ║
║   • /api/users          - User & role management              ║
║   • /api/integrations   - WMS connectors & EDI                ║
║   • /api/settings       - System configuration                ║
║   • /api/audit-logs     - Audit trail & compliance            ║
║                                                               ║
║   AI & Intelligence:                                          ║
║   • POST /api/chat      - Flow AI Assistant                   ║
║   • POST /api/actions   - Execute AI actions                  ║
║   • /api/ai/*           - AI Engine (forecasting, anomaly)    ║
║                                                               ║
║   Intelligence Platform:                                      ║
║   • /api/intelligence/ingest/*     - WMS data ingestion       ║
║   • /api/intelligence/truth/*      - Inventory truth engine   ║
║   • /api/intelligence/root-cause/* - Root cause analysis      ║
║   • /api/intelligence/actions/*    - Action recommendations   ║
║   • /api/intelligence/reports/*    - Executive reports        ║
║                                                               ║
║   Real-Time:                                                  ║
║   • WebSocket (Socket.io) - Real-time updates                 ║
║                                                               ║
║   Status:                                                     ║
║   • AI: ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not configured'}                                      ║
║   • DB: PostgreSQL (Prisma)                                   ║
║   • WS: Socket.io enabled                                     ║
║   • OFBiz: Auto-sync enabled                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    // Start OFBiz auto-sync (every 5 minutes)
    if (process.env.OFBIZ_AUTO_SYNC !== 'false') {
      const syncInterval = parseInt(process.env.OFBIZ_SYNC_INTERVAL) || 5;
      ofbizSync.startAutoSync(prisma, syncInterval);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stop();
  ofbizSync.stopAutoSync();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  schedulerService.stop();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
