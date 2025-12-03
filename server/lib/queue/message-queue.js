/**
 * Message Queue System
 * Async processing for integrations, EDI, and background tasks
 * Supports in-memory queue (development) and can be extended for Redis/RabbitMQ
 */

import { EventEmitter } from 'events';

/**
 * Base Message Queue Interface
 */
export class MessageQueue extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.name = config.name || 'default';
    this.connected = false;
  }

  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  async publish(queue, message, options = {}) {
    throw new Error('publish() must be implemented by subclass');
  }

  async subscribe(queue, handler, options = {}) {
    throw new Error('subscribe() must be implemented by subclass');
  }

  async unsubscribe(queue) {
    throw new Error('unsubscribe() must be implemented by subclass');
  }
}

/**
 * In-Memory Message Queue
 * For development and single-instance deployments
 */
export class InMemoryQueue extends MessageQueue {
  constructor(config = {}) {
    super(config);
    this.queues = new Map();
    this.handlers = new Map();
    this.deadLetterQueue = [];
    this.processing = new Map();
    this.stats = {
      published: 0,
      processed: 0,
      failed: 0,
      deadLettered: 0
    };
  }

  async connect() {
    this.connected = true;
    this.emit('connected');
    return true;
  }

  async disconnect() {
    // Stop all processors
    for (const [queue, processor] of this.processing) {
      if (processor.interval) {
        clearInterval(processor.interval);
      }
    }
    this.processing.clear();
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Publish a message to a queue
   */
  async publish(queueName, message, options = {}) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    const envelope = {
      id: generateMessageId(),
      queue: queueName,
      payload: message,
      options,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      priority: options.priority || 5,
      correlationId: options.correlationId,
      replyTo: options.replyTo
    };

    // Handle delayed messages
    if (envelope.delay > 0) {
      setTimeout(() => {
        this.enqueue(queueName, envelope);
      }, envelope.delay);
    } else {
      this.enqueue(queueName, envelope);
    }

    this.stats.published++;
    this.emit('published', { queue: queueName, messageId: envelope.id });

    return envelope.id;
  }

  /**
   * Internal enqueue with priority sorting
   */
  enqueue(queueName, envelope) {
    const queue = this.queues.get(queueName) || [];

    // Insert based on priority (lower number = higher priority)
    let inserted = false;
    for (let i = 0; i < queue.length; i++) {
      if (envelope.priority < queue[i].priority) {
        queue.splice(i, 0, envelope);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      queue.push(envelope);
    }

    this.queues.set(queueName, queue);

    // Trigger processing if handler exists
    if (this.handlers.has(queueName)) {
      this.processNext(queueName);
    }
  }

  /**
   * Subscribe to a queue with a handler
   */
  async subscribe(queueName, handler, options = {}) {
    const subscription = {
      handler,
      options: {
        concurrency: options.concurrency || 1,
        prefetch: options.prefetch || 10,
        ...options
      },
      active: 0,
      paused: false
    };

    this.handlers.set(queueName, subscription);

    // Start processing existing messages
    this.startProcessor(queueName);

    this.emit('subscribed', { queue: queueName });
    return true;
  }

  /**
   * Unsubscribe from a queue
   */
  async unsubscribe(queueName) {
    this.handlers.delete(queueName);

    if (this.processing.has(queueName)) {
      const processor = this.processing.get(queueName);
      if (processor.interval) {
        clearInterval(processor.interval);
      }
      this.processing.delete(queueName);
    }

    this.emit('unsubscribed', { queue: queueName });
    return true;
  }

  /**
   * Start processing loop for a queue
   */
  startProcessor(queueName) {
    if (this.processing.has(queueName)) return;

    const processor = {
      interval: setInterval(() => {
        this.processNext(queueName);
      }, 100) // Check every 100ms
    };

    this.processing.set(queueName, processor);
  }

  /**
   * Process next message in queue
   */
  async processNext(queueName) {
    const subscription = this.handlers.get(queueName);
    if (!subscription || subscription.paused) return;

    const queue = this.queues.get(queueName) || [];
    if (queue.length === 0) return;

    // Check concurrency limit
    if (subscription.active >= subscription.options.concurrency) return;

    // Get next message
    const envelope = queue.shift();
    if (!envelope) return;

    subscription.active++;
    envelope.attempts++;

    this.emit('processing', { queue: queueName, messageId: envelope.id });

    try {
      // Create message context
      const context = {
        messageId: envelope.id,
        correlationId: envelope.correlationId,
        timestamp: envelope.timestamp,
        attempts: envelope.attempts,
        queue: queueName,
        ack: () => this.acknowledge(envelope),
        nack: (requeue = true) => this.negativeAck(queueName, envelope, requeue),
        reply: (response) => this.reply(envelope, response)
      };

      // Call handler
      await subscription.handler(envelope.payload, context);

      // Auto-ack if not manually handled
      this.acknowledge(envelope);

    } catch (error) {
      this.emit('processingError', {
        queue: queueName,
        messageId: envelope.id,
        error: error.message
      });

      // Retry or dead letter
      if (envelope.attempts < envelope.maxAttempts) {
        // Exponential backoff
        envelope.delay = Math.min(30000, Math.pow(2, envelope.attempts) * 1000);
        setTimeout(() => {
          this.enqueue(queueName, envelope);
        }, envelope.delay);
      } else {
        this.deadLetter(envelope, error);
      }
    } finally {
      subscription.active--;
    }
  }

  /**
   * Acknowledge a message (success)
   */
  acknowledge(envelope) {
    this.stats.processed++;
    this.emit('acknowledged', { queue: envelope.queue, messageId: envelope.id });
  }

  /**
   * Negative acknowledge (failure)
   */
  negativeAck(queueName, envelope, requeue = true) {
    this.stats.failed++;

    if (requeue && envelope.attempts < envelope.maxAttempts) {
      this.enqueue(queueName, envelope);
      this.emit('requeued', { queue: queueName, messageId: envelope.id });
    } else {
      this.deadLetter(envelope, new Error('Max retries exceeded'));
    }
  }

  /**
   * Move message to dead letter queue
   */
  deadLetter(envelope, error) {
    this.deadLetterQueue.push({
      ...envelope,
      deadLetteredAt: Date.now(),
      error: error.message
    });

    this.stats.deadLettered++;
    this.emit('deadLettered', {
      queue: envelope.queue,
      messageId: envelope.id,
      error: error.message
    });
  }

  /**
   * Reply to a message (for request-response pattern)
   */
  reply(envelope, response) {
    if (envelope.replyTo) {
      this.publish(envelope.replyTo, response, {
        correlationId: envelope.correlationId
      });
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const queueStats = {};

    for (const [name, queue] of this.queues) {
      queueStats[name] = {
        pending: queue.length,
        processing: this.handlers.get(name)?.active || 0
      };
    }

    return {
      ...this.stats,
      queues: queueStats,
      deadLetterCount: this.deadLetterQueue.length
    };
  }

  /**
   * Get dead letter queue messages
   */
  getDeadLetters(limit = 100) {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Retry dead letter message
   */
  async retryDeadLetter(messageId) {
    const index = this.deadLetterQueue.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    const message = this.deadLetterQueue.splice(index, 1)[0];
    message.attempts = 0;
    delete message.deadLetteredAt;
    delete message.error;

    await this.publish(message.queue, message.payload, message.options);
    return true;
  }

  /**
   * Purge dead letter queue
   */
  purgeDeadLetters() {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return count;
  }

  /**
   * Pause queue processing
   */
  pauseQueue(queueName) {
    const subscription = this.handlers.get(queueName);
    if (subscription) {
      subscription.paused = true;
      this.emit('paused', { queue: queueName });
      return true;
    }
    return false;
  }

  /**
   * Resume queue processing
   */
  resumeQueue(queueName) {
    const subscription = this.handlers.get(queueName);
    if (subscription) {
      subscription.paused = false;
      this.emit('resumed', { queue: queueName });
      return true;
    }
    return false;
  }

  /**
   * Get queue length
   */
  getQueueLength(queueName) {
    return this.queues.get(queueName)?.length || 0;
  }

  /**
   * Purge a queue
   */
  purgeQueue(queueName) {
    const count = this.queues.get(queueName)?.length || 0;
    this.queues.set(queueName, []);
    this.emit('purged', { queue: queueName, count });
    return count;
  }
}

/**
 * Redis-based Message Queue (placeholder for production)
 * In production, use ioredis or bull/bullmq
 */
export class RedisQueue extends MessageQueue {
  constructor(config) {
    super(config);
    this.redisUrl = config.redisUrl || 'redis://localhost:6379';
  }

  async connect() {
    // In production:
    // const Redis = require('ioredis');
    // this.client = new Redis(this.redisUrl);
    // this.subscriber = new Redis(this.redisUrl);

    console.log('RedisQueue: Would connect to', this.redisUrl);
    this.connected = true;
    this.emit('connected');
    return true;
  }

  async disconnect() {
    // In production:
    // await this.client.quit();
    // await this.subscriber.quit();

    this.connected = false;
    this.emit('disconnected');
  }

  async publish(queueName, message, options = {}) {
    // In production:
    // const messageId = generateMessageId();
    // const envelope = JSON.stringify({ id: messageId, payload: message, ...options });
    // if (options.delay) {
    //   await this.client.zadd(`${queueName}:delayed`, Date.now() + options.delay, envelope);
    // } else {
    //   await this.client.lpush(queueName, envelope);
    // }
    // return messageId;

    console.log('RedisQueue.publish:', queueName, message);
    return generateMessageId();
  }

  async subscribe(queueName, handler, options = {}) {
    // In production, use BRPOP with blocking or pub/sub
    console.log('RedisQueue.subscribe:', queueName);
    return true;
  }

  async unsubscribe(queueName) {
    console.log('RedisQueue.unsubscribe:', queueName);
    return true;
  }
}

/**
 * RabbitMQ-based Message Queue (placeholder for production)
 * In production, use amqplib
 */
export class RabbitMQQueue extends MessageQueue {
  constructor(config) {
    super(config);
    this.amqpUrl = config.amqpUrl || 'amqp://localhost';
  }

  async connect() {
    // In production:
    // const amqp = require('amqplib');
    // this.connection = await amqp.connect(this.amqpUrl);
    // this.channel = await this.connection.createChannel();

    console.log('RabbitMQQueue: Would connect to', this.amqpUrl);
    this.connected = true;
    this.emit('connected');
    return true;
  }

  async disconnect() {
    // In production:
    // await this.channel.close();
    // await this.connection.close();

    this.connected = false;
    this.emit('disconnected');
  }

  async publish(queueName, message, options = {}) {
    // In production:
    // await this.channel.assertQueue(queueName, { durable: true });
    // this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    //   persistent: true,
    //   messageId: generateMessageId(),
    //   ...options
    // });

    console.log('RabbitMQQueue.publish:', queueName, message);
    return generateMessageId();
  }

  async subscribe(queueName, handler, options = {}) {
    // In production:
    // await this.channel.assertQueue(queueName, { durable: true });
    // await this.channel.prefetch(options.prefetch || 1);
    // this.channel.consume(queueName, async (msg) => {
    //   const content = JSON.parse(msg.content.toString());
    //   await handler(content, { ack: () => this.channel.ack(msg), nack: () => this.channel.nack(msg) });
    // });

    console.log('RabbitMQQueue.subscribe:', queueName);
    return true;
  }

  async unsubscribe(queueName) {
    console.log('RabbitMQQueue.unsubscribe:', queueName);
    return true;
  }
}

// Helper function to generate unique message IDs
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Factory function
export function createMessageQueue(type = 'memory', config = {}) {
  switch (type.toLowerCase()) {
    case 'redis':
      return new RedisQueue(config);
    case 'rabbitmq':
    case 'amqp':
      return new RabbitMQQueue(config);
    case 'memory':
    default:
      return new InMemoryQueue(config);
  }
}

export { generateMessageId };
