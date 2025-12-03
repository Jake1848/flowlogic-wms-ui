/**
 * Job Processor
 * Handles background jobs for integrations, reports, and scheduled tasks
 */

import { EventEmitter } from 'events';

/**
 * Job definition
 */
export class Job {
  constructor(type, data, options = {}) {
    this.id = options.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.type = type;
    this.data = data;
    this.status = 'pending';
    this.priority = options.priority || 5;
    this.attempts = 0;
    this.maxAttempts = options.maxAttempts || 3;
    this.timeout = options.timeout || 300000; // 5 minutes default
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.result = null;
    this.error = null;
    this.progress = 0;
    this.logs = [];
  }

  log(message) {
    this.logs.push({
      timestamp: new Date(),
      message
    });
  }

  setProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
  }
}

/**
 * Job Processor - handles background job execution
 */
export class JobProcessor extends EventEmitter {
  constructor(queue, options = {}) {
    super();
    this.queue = queue;
    this.handlers = new Map();
    this.runningJobs = new Map();
    this.jobHistory = new Map();
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.concurrency = options.concurrency || 5;
    this.isProcessing = false;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0
    };
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType, handler, options = {}) {
    this.handlers.set(jobType, {
      handler,
      options: {
        timeout: options.timeout || 300000,
        retries: options.retries || 3,
        ...options
      }
    });

    this.emit('handlerRegistered', { type: jobType });
    return this;
  }

  /**
   * Start processing jobs
   */
  async start() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    // Subscribe to job queue
    await this.queue.subscribe('jobs', async (payload, context) => {
      await this.processJob(payload, context);
    }, {
      concurrency: this.concurrency
    });

    // Subscribe to priority queue
    await this.queue.subscribe('jobs:priority', async (payload, context) => {
      await this.processJob(payload, context);
    }, {
      concurrency: Math.ceil(this.concurrency / 2)
    });

    this.emit('started');
  }

  /**
   * Stop processing jobs
   */
  async stop() {
    this.isProcessing = false;
    await this.queue.unsubscribe('jobs');
    await this.queue.unsubscribe('jobs:priority');
    this.emit('stopped');
  }

  /**
   * Add a job to the queue
   */
  async addJob(type, data, options = {}) {
    const job = new Job(type, data, options);

    // Store in history
    this.jobHistory.set(job.id, job);
    this.trimHistory();

    // Determine queue based on priority
    const queueName = options.priority <= 2 ? 'jobs:priority' : 'jobs';

    // Publish to queue
    await this.queue.publish(queueName, {
      jobId: job.id,
      type: job.type,
      data: job.data,
      options
    }, {
      priority: job.priority,
      delay: options.delay,
      maxAttempts: job.maxAttempts
    });

    this.emit('jobAdded', { jobId: job.id, type });
    return job;
  }

  /**
   * Process a job
   */
  async processJob(payload, context) {
    const { jobId, type, data } = payload;

    // Get or create job record
    let job = this.jobHistory.get(jobId);
    if (!job) {
      job = new Job(type, data, { id: jobId });
      this.jobHistory.set(jobId, job);
    }

    const handlerDef = this.handlers.get(type);
    if (!handlerDef) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${type}`;
      this.emit('jobFailed', { job, error: job.error });
      context.ack();
      return;
    }

    job.status = 'running';
    job.startedAt = new Date();
    job.attempts++;
    this.runningJobs.set(jobId, job);

    this.emit('jobStarted', { job });

    // Create job context
    const jobContext = {
      job,
      log: (msg) => job.log(msg),
      setProgress: (p) => {
        job.setProgress(p);
        this.emit('jobProgress', { job, progress: p });
      },
      updateData: (updates) => {
        job.data = { ...job.data, ...updates };
      }
    };

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (job.status === 'running') {
        job.status = 'failed';
        job.error = 'Job timed out';
        job.completedAt = new Date();
        this.runningJobs.delete(jobId);
        this.stats.failed++;
        this.emit('jobTimeout', { job });
        context.nack(job.attempts < job.maxAttempts);
      }
    }, handlerDef.options.timeout);

    try {
      // Execute handler
      const result = await handlerDef.handler(data, jobContext);

      clearTimeout(timeoutId);

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      job.progress = 100;

      this.stats.processed++;
      this.stats.succeeded++;

      this.emit('jobCompleted', { job, result });
      context.ack();

    } catch (error) {
      clearTimeout(timeoutId);

      job.error = error.message;
      job.log(`Error: ${error.message}`);

      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';
        this.stats.retried++;
        this.emit('jobRetrying', { job, error: error.message, attempt: job.attempts });
        context.nack(true);
      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        this.stats.failed++;
        this.emit('jobFailed', { job, error: error.message });
        context.ack(); // Ack to remove from queue (will be in dead letter)
      }
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId) {
    return this.jobHistory.get(jobId) || this.runningJobs.get(jobId);
  }

  /**
   * Get all jobs of a certain status
   */
  getJobsByStatus(status) {
    const jobs = [];
    for (const job of this.jobHistory.values()) {
      if (job.status === status) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  /**
   * Get running jobs
   */
  getRunningJobs() {
    return Array.from(this.runningJobs.values());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      running: this.runningJobs.size,
      pending: this.queue.getQueueLength('jobs') + this.queue.getQueueLength('jobs:priority'),
      historySize: this.jobHistory.size
    };
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId) {
    const job = this.jobHistory.get(jobId);
    if (!job || job.status !== 'failed') {
      return false;
    }

    // Reset job
    job.status = 'pending';
    job.attempts = 0;
    job.error = null;
    job.result = null;
    job.completedAt = null;
    job.progress = 0;

    // Re-queue
    await this.queue.publish('jobs', {
      jobId: job.id,
      type: job.type,
      data: job.data
    });

    this.emit('jobRetried', { job });
    return true;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId) {
    const job = this.jobHistory.get(jobId);
    if (!job) return false;

    if (job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.emit('jobCancelled', { job });
      return true;
    }

    return false;
  }

  /**
   * Trim job history to max size
   */
  trimHistory() {
    if (this.jobHistory.size > this.maxHistorySize) {
      const entries = Array.from(this.jobHistory.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

      const toRemove = entries.slice(0, entries.length - this.maxHistorySize);
      for (const [key] of toRemove) {
        this.jobHistory.delete(key);
      }
    }
  }

  /**
   * Clear completed jobs from history
   */
  clearCompletedJobs() {
    let cleared = 0;
    for (const [key, job] of this.jobHistory) {
      if (job.status === 'completed' || job.status === 'cancelled') {
        this.jobHistory.delete(key);
        cleared++;
      }
    }
    return cleared;
  }
}

/**
 * Scheduled Job Runner
 * Handles cron-like job scheduling
 */
export class ScheduledJobRunner extends EventEmitter {
  constructor(jobProcessor) {
    super();
    this.jobProcessor = jobProcessor;
    this.schedules = new Map();
    this.timers = new Map();
  }

  /**
   * Schedule a recurring job
   */
  schedule(name, cronOrInterval, jobType, jobData, options = {}) {
    // Cancel existing schedule
    this.cancel(name);

    const schedule = {
      name,
      jobType,
      jobData,
      options,
      lastRun: null,
      nextRun: null,
      runCount: 0
    };

    // Handle interval (number in ms)
    if (typeof cronOrInterval === 'number') {
      schedule.type = 'interval';
      schedule.interval = cronOrInterval;
      schedule.nextRun = new Date(Date.now() + cronOrInterval);

      const timer = setInterval(async () => {
        await this.runScheduledJob(name);
      }, cronOrInterval);

      this.timers.set(name, timer);

    } else {
      // Handle cron expression
      schedule.type = 'cron';
      schedule.cron = cronOrInterval;
      schedule.nextRun = this.getNextCronTime(cronOrInterval);

      // Simple cron implementation (in production, use node-cron)
      this.startCronTimer(name, cronOrInterval);
    }

    this.schedules.set(name, schedule);
    this.emit('scheduled', { name, schedule });
    return schedule;
  }

  /**
   * Run a scheduled job immediately
   */
  async runScheduledJob(name) {
    const schedule = this.schedules.get(name);
    if (!schedule) return null;

    schedule.lastRun = new Date();
    schedule.runCount++;

    if (schedule.type === 'interval') {
      schedule.nextRun = new Date(Date.now() + schedule.interval);
    } else {
      schedule.nextRun = this.getNextCronTime(schedule.cron);
    }

    const job = await this.jobProcessor.addJob(
      schedule.jobType,
      schedule.jobData,
      {
        ...schedule.options,
        scheduleName: name
      }
    );

    this.emit('jobTriggered', { name, job });
    return job;
  }

  /**
   * Cancel a scheduled job
   */
  cancel(name) {
    if (this.timers.has(name)) {
      clearInterval(this.timers.get(name));
      this.timers.delete(name);
    }

    if (this.schedules.has(name)) {
      this.schedules.delete(name);
      this.emit('cancelled', { name });
      return true;
    }

    return false;
  }

  /**
   * Get all schedules
   */
  getSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Start cron timer (simplified implementation)
   */
  startCronTimer(name, cronExpression) {
    // Simple minute-based cron check
    const timer = setInterval(async () => {
      if (this.shouldRunCron(cronExpression)) {
        await this.runScheduledJob(name);
      }
    }, 60000); // Check every minute

    this.timers.set(name, timer);
  }

  /**
   * Check if cron should run now (simplified)
   */
  shouldRunCron(cronExpression) {
    // Simple cron patterns: '*/5 * * * *' (every 5 minutes)
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) return false;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Check minute
    if (minute !== '*') {
      if (minute.startsWith('*/')) {
        const interval = parseInt(minute.slice(2));
        if (now.getMinutes() % interval !== 0) return false;
      } else if (parseInt(minute) !== now.getMinutes()) {
        return false;
      }
    }

    // Check hour
    if (hour !== '*' && parseInt(hour) !== now.getHours()) {
      return false;
    }

    // Check day of month
    if (dayOfMonth !== '*' && parseInt(dayOfMonth) !== now.getDate()) {
      return false;
    }

    // Check month
    if (month !== '*' && parseInt(month) !== now.getMonth() + 1) {
      return false;
    }

    // Check day of week
    if (dayOfWeek !== '*' && parseInt(dayOfWeek) !== now.getDay()) {
      return false;
    }

    return true;
  }

  /**
   * Get next cron run time (simplified)
   */
  getNextCronTime(cronExpression) {
    // For now, just estimate next run
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts[0].startsWith('*/')) {
      const interval = parseInt(parts[0].slice(2));
      const minutes = Math.ceil(now.getMinutes() / interval) * interval;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes);
    }

    // Default to next hour
    return new Date(now.getTime() + 3600000);
  }

  /**
   * Stop all schedules
   */
  stopAll() {
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.schedules.clear();
    this.emit('allStopped');
  }
}

export { Job, JobProcessor, ScheduledJobRunner };
