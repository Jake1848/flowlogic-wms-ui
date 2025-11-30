/**
 * Claude Tool Definitions and Execution
 * Modular tool system for Flow AI WMS interactions
 */

import { tools } from './definitions.js';
import {
  investigateInventory,
  getInventorySummary,
  createInventoryAdjustment,
  investigateLocation,
  investigateUser,
  getLateOrders,
  getOrderDetails,
  updateOrderPriority,
  getAlerts,
  createAlert,
  createTask,
  searchProducts,
} from './executors/index.js';

// Re-export tool definitions
export { tools };
export {
  inventoryTools,
  locationTools,
  userTools,
  orderTools,
  alertTools,
  taskTools,
  productTools,
} from './definitions.js';

// Tool executor mapping
const toolExecutors = {
  investigate_inventory: investigateInventory,
  get_inventory_summary: getInventorySummary,
  create_inventory_adjustment: createInventoryAdjustment,
  investigate_location: investigateLocation,
  investigate_user: investigateUser,
  get_late_orders: getLateOrders,
  get_order_details: getOrderDetails,
  update_order_priority: updateOrderPriority,
  get_alerts: getAlerts,
  create_alert: createAlert,
  create_task: createTask,
  search_products: searchProducts,
};

/**
 * Create tool executor with Prisma database access
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Function} executeAction function
 */
export function createToolExecutor(prisma) {
  return async function executeAction(toolName, params) {
    console.log(`Executing tool: ${toolName}`, params);

    try {
      const executor = toolExecutors[toolName];

      if (!executor) {
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
        };
      }

      return await executor(prisma, params);
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);
      return {
        success: false,
        message: `Error executing ${toolName}: ${error.message}`,
      };
    }
  };
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use createToolExecutor(prisma) instead
 */
export async function executeAction(toolName, params) {
  console.warn('Using legacy executeAction without database access');
  return {
    success: false,
    message: 'Database not connected. Please use createToolExecutor(prisma) instead.',
  };
}
