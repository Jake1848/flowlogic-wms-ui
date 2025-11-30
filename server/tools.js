/**
 * Claude Tool Definitions and Execution
 *
 * This file re-exports from the modular tools directory for backwards compatibility.
 *
 * For new code, prefer importing directly from:
 * - './tools/definitions.js' - Tool definitions by domain
 * - './tools/executors/index.js' - Individual executor functions
 * - './tools/index.js' - Combined exports
 */

export {
  tools,
  inventoryTools,
  locationTools,
  userTools,
  orderTools,
  alertTools,
  taskTools,
  productTools,
  createToolExecutor,
  executeAction,
} from './tools/index.js';
