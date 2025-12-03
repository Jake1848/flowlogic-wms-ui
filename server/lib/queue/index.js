/**
 * Queue Module
 * Message queue and job processing for async operations
 */

export {
  MessageQueue,
  InMemoryQueue,
  RedisQueue,
  RabbitMQQueue,
  createMessageQueue,
  generateMessageId
} from './message-queue.js';

export {
  Job,
  JobProcessor,
  ScheduledJobRunner
} from './job-processor.js';

/**
 * Pre-defined job types for WMS operations
 */
export const JOB_TYPES = {
  // EDI Processing
  EDI_INBOUND_PROCESS: 'edi:inbound:process',
  EDI_OUTBOUND_GENERATE: 'edi:outbound:generate',
  EDI_VALIDATE: 'edi:validate',

  // ERP Sync
  ERP_SYNC_ORDERS: 'erp:sync:orders',
  ERP_SYNC_PRODUCTS: 'erp:sync:products',
  ERP_SYNC_INVENTORY: 'erp:sync:inventory',
  ERP_SEND_RECEIPT: 'erp:send:receipt',
  ERP_SEND_SHIPMENT: 'erp:send:shipment',
  ERP_SEND_ADJUSTMENT: 'erp:send:adjustment',

  // Reports
  REPORT_GENERATE: 'report:generate',
  REPORT_SCHEDULE: 'report:schedule',
  REPORT_EMAIL: 'report:email',

  // Inventory
  INVENTORY_SNAPSHOT: 'inventory:snapshot',
  INVENTORY_ABC_ANALYSIS: 'inventory:abc:analysis',
  INVENTORY_REPLENISHMENT: 'inventory:replenishment',

  // Notifications
  NOTIFICATION_EMAIL: 'notification:email',
  NOTIFICATION_SMS: 'notification:sms',
  NOTIFICATION_WEBHOOK: 'notification:webhook',

  // Maintenance
  CLEANUP_OLD_DATA: 'maintenance:cleanup',
  ARCHIVE_DATA: 'maintenance:archive',
  OPTIMIZE_DATABASE: 'maintenance:optimize'
};

/**
 * Queue names
 */
export const QUEUES = {
  JOBS: 'jobs',
  JOBS_PRIORITY: 'jobs:priority',
  EDI_INBOUND: 'edi:inbound',
  EDI_OUTBOUND: 'edi:outbound',
  ERP_SYNC: 'erp:sync',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports'
};

/**
 * Initialize the queue system with default handlers
 */
export async function initializeQueueSystem(options = {}) {
  const { InMemoryQueue } = await import('./message-queue.js');
  const { JobProcessor, ScheduledJobRunner } = await import('./job-processor.js');

  // Create queue
  const queueType = options.queueType || 'memory';
  let queue;

  switch (queueType) {
    case 'redis':
      const { RedisQueue } = await import('./message-queue.js');
      queue = new RedisQueue(options.redis || {});
      break;
    case 'rabbitmq':
      const { RabbitMQQueue } = await import('./message-queue.js');
      queue = new RabbitMQQueue(options.rabbitmq || {});
      break;
    default:
      queue = new InMemoryQueue(options.memory || {});
  }

  await queue.connect();

  // Create job processor
  const jobProcessor = new JobProcessor(queue, {
    concurrency: options.concurrency || 5,
    maxHistorySize: options.maxHistorySize || 1000
  });

  // Create scheduler
  const scheduler = new ScheduledJobRunner(jobProcessor);

  // Register default handlers if provided
  if (options.handlers) {
    for (const [type, handler] of Object.entries(options.handlers)) {
      jobProcessor.registerHandler(type, handler);
    }
  }

  // Start processor
  await jobProcessor.start();

  return {
    queue,
    jobProcessor,
    scheduler,

    // Convenience methods
    addJob: (type, data, opts) => jobProcessor.addJob(type, data, opts),
    schedule: (name, cron, type, data, opts) => scheduler.schedule(name, cron, type, data, opts),
    getStats: () => ({
      queue: queue.getStats(),
      jobs: jobProcessor.getStats(),
      schedules: scheduler.getSchedules()
    }),

    // Cleanup
    shutdown: async () => {
      scheduler.stopAll();
      await jobProcessor.stop();
      await queue.disconnect();
    }
  };
}

/**
 * Default job handlers for common operations
 */
export const defaultJobHandlers = {
  // EDI Processing Handler
  [JOB_TYPES.EDI_INBOUND_PROCESS]: async (data, context) => {
    context.log('Processing inbound EDI...');
    context.setProgress(10);

    // Parse EDI content
    const { parseEDI } = await import('../edi/index.js');
    const parsed = parseEDI(data.content);

    context.setProgress(50);
    context.log(`Parsed ${parsed.interchanges?.length || 0} interchanges`);

    // Process based on document type
    for (const interchange of parsed.interchanges || []) {
      for (const group of interchange.groups || []) {
        for (const transaction of group.transactions || []) {
          context.log(`Processing ${transaction.transactionSetId}`);
          // Document-specific processing would go here
        }
      }
    }

    context.setProgress(100);
    return { success: true, parsed };
  },

  // Report Generation Handler
  [JOB_TYPES.REPORT_GENERATE]: async (data, context) => {
    context.log(`Generating report: ${data.reportType}`);
    context.setProgress(10);

    // Report generation logic would go here
    await new Promise(resolve => setTimeout(resolve, 1000));

    context.setProgress(100);
    return { success: true, reportId: `RPT-${Date.now()}` };
  },

  // Notification Email Handler
  [JOB_TYPES.NOTIFICATION_EMAIL]: async (data, context) => {
    context.log(`Sending email to: ${data.to}`);

    // Email sending logic would go here
    // In production, use nodemailer or similar

    return { success: true, messageId: `MSG-${Date.now()}` };
  },

  // Webhook Handler
  [JOB_TYPES.NOTIFICATION_WEBHOOK]: async (data, context) => {
    context.log(`Calling webhook: ${data.url}`);

    // Webhook call would go here
    // In production, use fetch or axios

    return { success: true };
  },

  // Cleanup Handler
  [JOB_TYPES.CLEANUP_OLD_DATA]: async (data, context) => {
    context.log('Running data cleanup...');

    // Cleanup logic would go here

    return { success: true, cleaned: 0 };
  }
};

/**
 * Example usage:
 *
 * import { initializeQueueSystem, JOB_TYPES, defaultJobHandlers } from './lib/queue';
 *
 * const queueSystem = await initializeQueueSystem({
 *   queueType: 'memory', // or 'redis', 'rabbitmq'
 *   concurrency: 5,
 *   handlers: defaultJobHandlers
 * });
 *
 * // Add a job
 * await queueSystem.addJob(JOB_TYPES.EDI_INBOUND_PROCESS, { content: ediContent });
 *
 * // Schedule a recurring job
 * queueSystem.schedule(
 *   'daily-cleanup',
 *   '0 2 * * *', // 2 AM daily
 *   JOB_TYPES.CLEANUP_OLD_DATA,
 *   { daysToKeep: 90 }
 * );
 *
 * // Get stats
 * console.log(queueSystem.getStats());
 *
 * // Shutdown
 * await queueSystem.shutdown();
 */
