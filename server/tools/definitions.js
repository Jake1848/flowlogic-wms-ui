/**
 * Claude Tool Definitions
 * These define the tools available to Flow AI for WMS interactions
 */

// Inventory investigation tools
export const inventoryTools = [
  {
    name: 'investigate_inventory',
    description: 'Investigate inventory for a specific product by SKU. Returns inventory levels, locations, transaction history, and alerts.',
    input_schema: {
      type: 'object',
      properties: {
        sku: {
          type: 'string',
          description: 'The product SKU to investigate (e.g., "ELEC-LAPTOP-001")'
        },
        include_transactions: {
          type: 'boolean',
          description: 'Include recent transaction history',
          default: true
        }
      },
      required: ['sku']
    }
  },
  {
    name: 'get_inventory_summary',
    description: 'Get a summary of inventory status across the warehouse.',
    input_schema: {
      type: 'object',
      properties: {
        warehouse_id: {
          type: 'string',
          description: 'Optional warehouse ID to filter by'
        }
      }
    }
  },
  {
    name: 'create_inventory_adjustment',
    description: 'Create an inventory adjustment to correct a discrepancy. This action modifies inventory quantities.',
    input_schema: {
      type: 'object',
      properties: {
        inventory_id: {
          type: 'string',
          description: 'Inventory record ID to adjust'
        },
        adjustment_quantity: {
          type: 'number',
          description: 'Quantity to adjust (positive for increase, negative for decrease)'
        },
        reason: {
          type: 'string',
          description: 'Reason for the adjustment'
        }
      },
      required: ['inventory_id', 'adjustment_quantity', 'reason']
    }
  },
];

// Location investigation tools
export const locationTools = [
  {
    name: 'investigate_location',
    description: 'Investigate a specific warehouse location. Returns inventory contents, capacity info, and recent activity.',
    input_schema: {
      type: 'object',
      properties: {
        location_code: {
          type: 'string',
          description: 'The location code to investigate (e.g., "P001")'
        }
      },
      required: ['location_code']
    }
  },
];

// User/labor tools
export const userTools = [
  {
    name: 'investigate_user',
    description: 'Look up performance and activity for a specific warehouse user.',
    input_schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'The username to look up (e.g., "jdoe")'
        }
      },
      required: ['username']
    }
  },
];

// Order tools
export const orderTools = [
  {
    name: 'get_late_orders',
    description: 'Get details about all late orders including reasons and customer info.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return',
          default: 20
        }
      }
    }
  },
  {
    name: 'get_order_details',
    description: 'Get detailed information about a specific order.',
    input_schema: {
      type: 'object',
      properties: {
        order_number: {
          type: 'string',
          description: 'The order number (e.g., "SO-2024-0001")'
        }
      },
      required: ['order_number']
    }
  },
  {
    name: 'update_order_priority',
    description: 'Update the priority of one or more orders.',
    input_schema: {
      type: 'object',
      properties: {
        order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of order IDs to update'
        },
        priority: {
          type: 'number',
          description: 'New priority (1-10, 1 = highest)'
        },
        reason: {
          type: 'string',
          description: 'Reason for priority change'
        }
      },
      required: ['order_ids', 'priority']
    }
  },
];

// Alert tools
export const alertTools = [
  {
    name: 'get_alerts',
    description: 'Get current unresolved alerts in the system.',
    input_schema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
          description: 'Filter by severity level'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return',
          default: 20
        }
      }
    }
  },
  {
    name: 'create_alert',
    description: 'Create a new alert in the system.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['INVENTORY_DISCREPANCY', 'LOW_STOCK', 'OVERSTOCK', 'ORDER_LATE', 'ORDER_EXCEPTION', 'RECEIPT_ISSUE', 'LABOR_PERFORMANCE', 'SYSTEM_ERROR', 'CUSTOM'],
          description: 'Type of alert'
        },
        severity: {
          type: 'string',
          enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
          description: 'Severity level'
        },
        title: {
          type: 'string',
          description: 'Alert title'
        },
        message: {
          type: 'string',
          description: 'Alert message content'
        },
        suggested_action: {
          type: 'string',
          description: 'Suggested action to resolve the alert'
        }
      },
      required: ['type', 'severity', 'title', 'message']
    }
  },
];

// Task tools
export const taskTools = [
  {
    name: 'create_task',
    description: 'Create a warehouse task (pick, replenishment, cycle count, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['PICK', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'PACK', 'SHIP', 'RECEIVE', 'TRANSFER'],
          description: 'Type of task to create'
        },
        priority: {
          type: 'number',
          description: 'Priority 1-10 (1 = highest)',
          default: 5
        },
        order_id: {
          type: 'string',
          description: 'Order ID for pick/pack tasks'
        },
        location_code: {
          type: 'string',
          description: 'Location for replenishment/cycle count tasks'
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the task'
        }
      },
      required: ['type']
    }
  },
];

// Product tools
export const productTools = [
  {
    name: 'search_products',
    description: 'Search for products by SKU, name, or UPC.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (matches SKU, name, or UPC)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 10
        }
      },
      required: ['query']
    }
  },
];

// Combined tools export
export const tools = [
  ...inventoryTools,
  ...locationTools,
  ...userTools,
  ...orderTools,
  ...alertTools,
  ...taskTools,
  ...productTools,
];
