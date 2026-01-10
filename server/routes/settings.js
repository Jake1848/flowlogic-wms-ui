import { Router } from 'express';

/**
 * System Settings Routes
 * Handles system configuration, preferences, and administrative settings
 */
export default function settingsRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Setting categories
  const SETTING_CATEGORIES = [
    'GENERAL',
    'INVENTORY',
    'RECEIVING',
    'SHIPPING',
    'ORDERS',
    'LABOR',
    'REPORTS',
    'NOTIFICATIONS',
    'INTEGRATIONS',
    'SECURITY',
    'PRINTING',
    'MOBILE'
  ];

  // ==========================================
  // System Settings Management
  // ==========================================

  // Get all settings (optionally filtered by category)
  router.get('/', asyncHandler(async (req, res) => {
    const { category, search } = req.query;

    const where = {};

    if (category) where.category = category;

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { key: 'asc' }]
    });

    // Group by category
    const grouped = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    }

    res.json({ settings, grouped });
  }));

  // Get single setting by key
  router.get('/key/:key', asyncHandler(async (req, res) => {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: req.params.key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  }));

  // Get settings by category
  router.get('/category/:category', asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findMany({
      where: { category: req.params.category.toUpperCase() },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }]
    });

    res.json(settings);
  }));

  // Update single setting
  router.patch('/key/:key', asyncHandler(async (req, res) => {
    const { value } = req.body;

    const existing = await prisma.systemSetting.findUnique({
      where: { key: req.params.key }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Validate value type
    if (!validateSettingValue(existing.dataType, value)) {
      return res.status(400).json({ error: `Invalid value type. Expected ${existing.dataType}` });
    }

    const setting = await prisma.systemSetting.update({
      where: { key: req.params.key },
      data: {
        value: String(value),
        updatedAt: new Date(),
        updatedById: req.user?.id
      }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'SETTING_CHANGED',
        entityType: 'SystemSetting',
        entityId: setting.id,
        oldValue: existing.value,
        newValue: String(value),
        userId: req.user?.id,
        details: { key: setting.key, category: setting.category }
      }
    });

    res.json(setting);
  }));

  // Bulk update settings
  router.patch('/bulk', asyncHandler(async (req, res) => {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    const results = [];

    for (const { key, value } of settings) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key }
      });

      if (existing && validateSettingValue(existing.dataType, value)) {
        const updated = await prisma.systemSetting.update({
          where: { key },
          data: {
            value: String(value),
            updatedAt: new Date(),
            updatedById: req.user?.id
          }
        });

        await prisma.auditLog.create({
          data: {
            action: 'SETTING_CHANGED',
            entityType: 'SystemSetting',
            entityId: updated.id,
            oldValue: existing.value,
            newValue: String(value),
            userId: req.user?.id,
            details: { key }
          }
        });

        results.push({ key, success: true });
      } else {
        results.push({ key, success: false, error: existing ? 'Invalid value' : 'Not found' });
      }
    }

    res.json({ results });
  }));

  // Reset setting to default
  router.post('/key/:key/reset', asyncHandler(async (req, res) => {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: req.params.key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const updated = await prisma.systemSetting.update({
      where: { key: req.params.key },
      data: {
        value: setting.defaultValue,
        updatedAt: new Date(),
        updatedById: req.user?.id
      }
    });

    res.json(updated);
  }));

  // ==========================================
  // Company Settings
  // ==========================================

  // Get company settings
  router.get('/company', asyncHandler(async (req, res) => {
    const company = await prisma.company.findFirst({
      include: {
        warehouses: {
          where: { isActive: true },
          select: { id: true, code: true, name: true }
        }
      }
    });

    res.json(company || {});
  }));

  // Update company settings
  router.patch('/company', asyncHandler(async (req, res) => {
    const {
      name,
      code,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      website,
      timezone,
      dateFormat,
      currencyCode,
      logoUrl
    } = req.body;

    const existing = await prisma.company.findFirst();

    const company = existing
      ? await prisma.company.update({
          where: { id: existing.id },
          data: {
            ...(name && { name }),
            ...(code && { code }),
            ...(address && { address }),
            ...(city && { city }),
            ...(state && { state }),
            ...(zipCode && { zipCode }),
            ...(country && { country }),
            ...(phone && { phone }),
            ...(email && { email }),
            ...(website && { website }),
            ...(timezone && { timezone }),
            ...(dateFormat && { dateFormat }),
            ...(currencyCode && { currencyCode }),
            ...(logoUrl && { logoUrl }),
            updatedAt: new Date()
          }
        })
      : await prisma.company.create({
          data: {
            name: name || 'FlowLogic WMS',
            code: code || 'FL',
            address,
            city,
            state,
            zipCode,
            country: country || 'US',
            phone,
            email,
            timezone: timezone || 'America/New_York',
            dateFormat: dateFormat || 'MM/DD/YYYY',
            currencyCode: currencyCode || 'USD'
          }
        });

    res.json(company);
  }));

  // ==========================================
  // User Preferences
  // ==========================================

  // Get current user's preferences
  router.get('/preferences', asyncHandler(async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const preferences = await prisma.userPreference.findMany({
      where: { userId: req.user.id }
    });

    // Convert to key-value object
    const prefsObject = {};
    for (const pref of preferences) {
      prefsObject[pref.key] = pref.value;
    }

    res.json(prefsObject);
  }));

  // Update user preference
  router.patch('/preferences/:key', asyncHandler(async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { value } = req.body;

    const preference = await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: req.user.id,
          key: req.params.key
        }
      },
      create: {
        userId: req.user.id,
        key: req.params.key,
        value: JSON.stringify(value)
      },
      update: {
        value: JSON.stringify(value),
        updatedAt: new Date()
      }
    });

    res.json(preference);
  }));

  // Bulk update user preferences
  router.patch('/preferences', asyncHandler(async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { preferences } = req.body;

    const results = [];

    for (const [key, value] of Object.entries(preferences)) {
      const pref = await prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId: req.user.id,
            key
          }
        },
        create: {
          userId: req.user.id,
          key,
          value: JSON.stringify(value)
        },
        update: {
          value: JSON.stringify(value),
          updatedAt: new Date()
        }
      });
      results.push(pref);
    }

    res.json(results);
  }));

  // ==========================================
  // Feature Flags
  // ==========================================

  // Get all feature flags
  router.get('/features', asyncHandler(async (req, res) => {
    const features = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(features);
  }));

  // Get enabled features for current context
  router.get('/features/enabled', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const features = await prisma.featureFlag.findMany({
      where: { isEnabled: true }
    });

    // Filter by warehouse if specified
    const enabledFeatures = features
      .filter(f => {
        if (!f.warehouseIds || f.warehouseIds.length === 0) return true;
        if (!warehouseId) return true;
        return f.warehouseIds.includes(warehouseId);
      })
      .map(f => f.name);

    res.json(enabledFeatures);
  }));

  // Toggle feature flag
  router.patch('/features/:name', asyncHandler(async (req, res) => {
    const { isEnabled, warehouseIds, rolloutPercentage } = req.body;

    const feature = await prisma.featureFlag.upsert({
      where: { name: req.params.name },
      create: {
        name: req.params.name,
        isEnabled: isEnabled !== false,
        warehouseIds: warehouseIds || [],
        rolloutPercentage: rolloutPercentage || 100
      },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(warehouseIds && { warehouseIds }),
        ...(rolloutPercentage !== undefined && { rolloutPercentage }),
        updatedAt: new Date()
      }
    });

    res.json(feature);
  }));

  // ==========================================
  // Notification Settings
  // ==========================================

  // Get notification settings
  router.get('/notifications', asyncHandler(async (req, res) => {
    const settings = await prisma.notificationSetting.findMany({
      orderBy: [{ category: 'asc' }, { eventType: 'asc' }]
    });

    res.json(settings);
  }));

  // Update notification setting
  router.patch('/notifications/:eventType', asyncHandler(async (req, res) => {
    const { emailEnabled, smsEnabled, pushEnabled, inAppEnabled, recipients } = req.body;

    const setting = await prisma.notificationSetting.upsert({
      where: { eventType: req.params.eventType },
      create: {
        eventType: req.params.eventType,
        emailEnabled: emailEnabled || false,
        smsEnabled: smsEnabled || false,
        pushEnabled: pushEnabled || false,
        inAppEnabled: inAppEnabled !== false,
        recipients: recipients || []
      },
      update: {
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(smsEnabled !== undefined && { smsEnabled }),
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(inAppEnabled !== undefined && { inAppEnabled }),
        ...(recipients && { recipients }),
        updatedAt: new Date()
      }
    });

    res.json(setting);
  }));

  // ==========================================
  // Print Settings
  // ==========================================

  // Get print configurations
  router.get('/print', asyncHandler(async (req, res) => {
    const configs = await prisma.printConfig.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(configs);
  }));

  // Get printers
  router.get('/print/printers', asyncHandler(async (req, res) => {
    const printers = await prisma.printer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(printers);
  }));

  // Add/update printer
  router.post('/print/printers', asyncHandler(async (req, res) => {
    const { name, type, ipAddress, port, location, isDefault, labelFormats } = req.body;

    const printer = await prisma.printer.create({
      data: {
        name,
        type,
        ipAddress,
        port: port || 9100,
        location,
        isDefault: isDefault || false,
        labelFormats: labelFormats || [],
        isActive: true
      }
    });

    // If set as default, unset other defaults
    if (isDefault) {
      await prisma.printer.updateMany({
        where: { id: { not: printer.id }, type },
        data: { isDefault: false }
      });
    }

    res.status(201).json(printer);
  }));

  // Update print config
  router.patch('/print/:configId', asyncHandler(async (req, res) => {
    const { printerId, copies, labelFormat, orientation, paperSize } = req.body;

    const config = await prisma.printConfig.update({
      where: { id: req.params.configId },
      data: {
        ...(printerId && { printerId }),
        ...(copies !== undefined && { copies }),
        ...(labelFormat && { labelFormat }),
        ...(orientation && { orientation }),
        ...(paperSize && { paperSize }),
        updatedAt: new Date()
      }
    });

    res.json(config);
  }));

  // ==========================================
  // System Information
  // ==========================================

  // Get system info - AI Intelligence Platform
  router.get('/system', asyncHandler(async (req, res) => {
    const [userCount, warehouseCount, integrationCount, discrepancyCount, snapshotCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.integration.count({ where: { status: 'ACTIVE' } }),
      prisma.discrepancy.count({ where: { status: 'OPEN' } }),
      prisma.inventorySnapshot.count()
    ]);

    res.json({
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      platform: 'FlowLogic AI Intelligence Platform',
      database: {
        type: 'PostgreSQL',
        status: 'connected'
      },
      statistics: {
        users: userCount,
        warehouses: warehouseCount,
        activeIntegrations: integrationCount,
        openDiscrepancies: discrepancyCount,
        inventorySnapshots: snapshotCount
      },
      serverTime: new Date().toISOString(),
      uptime: process.uptime()
    });
  }));

  // Get available categories
  router.get('/categories', (req, res) => {
    res.json(SETTING_CATEGORIES);
  });

  // Initialize default settings (admin only)
  router.post('/initialize', asyncHandler(async (req, res) => {
    const defaultSettings = getDefaultSettings();

    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        create: setting,
        update: {}
      });
    }

    res.json({ message: `Initialized ${defaultSettings.length} default settings` });
  }));

  return router;
}

// Helper function to validate setting value type
function validateSettingValue(dataType, value) {
  switch (dataType) {
    case 'STRING':
      return typeof value === 'string';
    case 'NUMBER':
      return !isNaN(Number(value));
    case 'BOOLEAN':
      return value === true || value === false || value === 'true' || value === 'false';
    case 'JSON':
      try {
        if (typeof value === 'object') return true;
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    case 'DATE':
      return !isNaN(Date.parse(value));
    default:
      return true;
  }
}

// Default system settings
function getDefaultSettings() {
  return [
    // General settings
    { key: 'company.name', label: 'Company Name', category: 'GENERAL', dataType: 'STRING', value: 'FlowLogic WMS', defaultValue: 'FlowLogic WMS', sortOrder: 1 },
    { key: 'company.timezone', label: 'Timezone', category: 'GENERAL', dataType: 'STRING', value: 'America/New_York', defaultValue: 'America/New_York', sortOrder: 2 },
    { key: 'company.dateFormat', label: 'Date Format', category: 'GENERAL', dataType: 'STRING', value: 'MM/DD/YYYY', defaultValue: 'MM/DD/YYYY', sortOrder: 3 },
    { key: 'company.currency', label: 'Currency', category: 'GENERAL', dataType: 'STRING', value: 'USD', defaultValue: 'USD', sortOrder: 4 },

    // Inventory settings
    { key: 'inventory.allowNegative', label: 'Allow Negative Inventory', category: 'INVENTORY', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 1 },
    { key: 'inventory.defaultUOM', label: 'Default UOM', category: 'INVENTORY', dataType: 'STRING', value: 'EA', defaultValue: 'EA', sortOrder: 2 },
    { key: 'inventory.lotTracking', label: 'Enable Lot Tracking', category: 'INVENTORY', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 3 },
    { key: 'inventory.serialTracking', label: 'Enable Serial Tracking', category: 'INVENTORY', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 4 },
    { key: 'inventory.expirationTracking', label: 'Enable Expiration Tracking', category: 'INVENTORY', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 5 },

    // Receiving settings
    { key: 'receiving.requirePO', label: 'Require PO for Receiving', category: 'RECEIVING', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 1 },
    { key: 'receiving.overReceivePercent', label: 'Over-Receive Tolerance %', category: 'RECEIVING', dataType: 'NUMBER', value: '10', defaultValue: '10', sortOrder: 2 },
    { key: 'receiving.autoQC', label: 'Auto Quality Check', category: 'RECEIVING', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 3 },

    // Shipping settings
    { key: 'shipping.autoAllocate', label: 'Auto Allocate Inventory', category: 'SHIPPING', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 1 },
    { key: 'shipping.requireWeight', label: 'Require Package Weight', category: 'SHIPPING', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 2 },
    { key: 'shipping.defaultCarrier', label: 'Default Carrier', category: 'SHIPPING', dataType: 'STRING', value: '', defaultValue: '', sortOrder: 3 },

    // Order settings
    { key: 'orders.autoConfirm', label: 'Auto Confirm Orders', category: 'ORDERS', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 1 },
    { key: 'orders.pickMethod', label: 'Default Pick Method', category: 'ORDERS', dataType: 'STRING', value: 'WAVE', defaultValue: 'WAVE', sortOrder: 2 },
    { key: 'orders.batchSize', label: 'Default Batch Size', category: 'ORDERS', dataType: 'NUMBER', value: '50', defaultValue: '50', sortOrder: 3 },

    // Labor settings
    { key: 'labor.trackTime', label: 'Track Labor Time', category: 'LABOR', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 1 },
    { key: 'labor.requireLogin', label: 'Require User Login', category: 'LABOR', dataType: 'BOOLEAN', value: 'true', defaultValue: 'true', sortOrder: 2 },
    { key: 'labor.overtimeThreshold', label: 'Overtime Threshold (hours)', category: 'LABOR', dataType: 'NUMBER', value: '8', defaultValue: '8', sortOrder: 3 },

    // Security settings
    { key: 'security.passwordMinLength', label: 'Min Password Length', category: 'SECURITY', dataType: 'NUMBER', value: '8', defaultValue: '8', sortOrder: 1 },
    { key: 'security.sessionTimeout', label: 'Session Timeout (minutes)', category: 'SECURITY', dataType: 'NUMBER', value: '480', defaultValue: '480', sortOrder: 2 },
    { key: 'security.maxLoginAttempts', label: 'Max Login Attempts', category: 'SECURITY', dataType: 'NUMBER', value: '5', defaultValue: '5', sortOrder: 3 },
    { key: 'security.requireMFA', label: 'Require MFA', category: 'SECURITY', dataType: 'BOOLEAN', value: 'false', defaultValue: 'false', sortOrder: 4 }
  ];
}
