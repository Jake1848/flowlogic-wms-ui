/**
 * File Poller
 * Monitors FTP/SFTP directories for new files and processes them
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { createFileTransferClient } from './ftp-client.js';

/**
 * File Poller - monitors remote directories for new files
 */
export class FilePoller extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      pollInterval: 60000, // 1 minute default
      processedDir: 'archive',
      errorDir: 'error',
      filePattern: '*',
      deleteAfterProcess: false,
      moveAfterProcess: true,
      ...config
    };

    this.client = null;
    this.isPolling = false;
    this.pollTimer = null;
    this.processedFiles = new Set();
    this.stats = {
      filesProcessed: 0,
      filesErrored: 0,
      lastPollTime: null,
      lastFileTime: null
    };
  }

  /**
   * Start polling
   */
  async start() {
    if (this.isPolling) {
      throw new Error('Poller is already running');
    }

    this.emit('starting');

    // Create and connect client
    this.client = createFileTransferClient(this.config.connection);
    await this.client.connect();

    // Set up event forwarding
    this.client.on('error', (err) => this.emit('clientError', err));

    this.isPolling = true;

    // Initial poll
    await this.poll();

    // Set up interval
    this.pollTimer = setInterval(() => {
      this.poll().catch(err => this.emit('pollError', err));
    }, this.config.pollInterval);

    this.emit('started', { interval: this.config.pollInterval });
  }

  /**
   * Stop polling
   */
  async stop() {
    if (!this.isPolling) return;

    this.emit('stopping');

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    this.isPolling = false;
    this.emit('stopped');
  }

  /**
   * Perform a single poll
   */
  async poll() {
    if (!this.client?.connected) {
      await this.client?.connect();
    }

    this.stats.lastPollTime = new Date();
    this.emit('polling', { path: this.config.remotePath });

    try {
      // List files in remote directory
      const files = await this.client.list(this.config.remotePath);

      // Filter files based on pattern and exclude directories
      const filesToProcess = files.filter(file => {
        // Skip directories
        if (file.type === 2 || file.type === 'd') return false;

        // Skip already processed files
        const fullPath = path.join(this.config.remotePath, file.name);
        if (this.processedFiles.has(fullPath)) return false;

        // Check pattern match
        if (this.config.filePattern !== '*') {
          const pattern = new RegExp(
            this.config.filePattern
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.')
          );
          if (!pattern.test(file.name)) return false;
        }

        return true;
      });

      this.emit('filesFound', { count: filesToProcess.length });

      // Process each file
      for (const file of filesToProcess) {
        await this.processFile(file);
      }

      this.emit('pollComplete', {
        filesProcessed: filesToProcess.length,
        stats: this.stats
      });

    } catch (error) {
      this.emit('pollError', error);
      throw error;
    }
  }

  /**
   * Process a single file
   */
  async processFile(file) {
    const remotePath = path.join(this.config.remotePath, file.name);

    this.emit('processingFile', { file: file.name, path: remotePath });

    try {
      // Download file content
      const content = await this.client.getContent(remotePath);

      // Emit for external processing
      this.emit('fileReceived', {
        filename: file.name,
        path: remotePath,
        size: file.size,
        modifyTime: file.modifyTime || file.date,
        content
      });

      // Mark as processed
      this.processedFiles.add(remotePath);
      this.stats.filesProcessed++;
      this.stats.lastFileTime = new Date();

      // Handle post-processing
      if (this.config.deleteAfterProcess) {
        await this.client.delete(remotePath);
        this.emit('fileDeleted', { path: remotePath });
      } else if (this.config.moveAfterProcess && this.config.processedDir) {
        const archivePath = path.join(
          this.config.remotePath,
          this.config.processedDir,
          `${Date.now()}_${file.name}`
        );
        await this.client.rename(remotePath, archivePath);
        this.emit('fileMoved', { from: remotePath, to: archivePath });
      }

      this.emit('fileProcessed', { file: file.name });

    } catch (error) {
      this.stats.filesErrored++;
      this.emit('fileError', { file: file.name, error });

      // Move to error directory if configured
      if (this.config.errorDir) {
        try {
          const errorPath = path.join(
            this.config.remotePath,
            this.config.errorDir,
            `${Date.now()}_${file.name}`
          );
          await this.client.rename(remotePath, errorPath);
          this.emit('fileMovedToError', { from: remotePath, to: errorPath });
        } catch (moveError) {
          this.emit('error', moveError);
        }
      }
    }
  }

  /**
   * Get poller status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      connected: this.client?.connected || false,
      config: {
        remotePath: this.config.remotePath,
        pollInterval: this.config.pollInterval,
        filePattern: this.config.filePattern
      },
      stats: this.stats
    };
  }

  /**
   * Clear processed files cache (to reprocess files)
   */
  clearProcessedCache() {
    this.processedFiles.clear();
    this.emit('cacheCleared');
  }
}

/**
 * File Sender - sends files to remote directories
 */
export class FileSender extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      ...config
    };
    this.client = null;
    this.connected = false;
    this.stats = {
      filesSent: 0,
      filesErrored: 0,
      lastSendTime: null
    };
  }

  /**
   * Connect to remote server
   */
  async connect() {
    this.client = createFileTransferClient(this.config.connection);
    await this.client.connect();
    this.connected = true;
    this.emit('connected');
  }

  /**
   * Disconnect from remote server
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Send a file
   */
  async sendFile(localPath, remotePath) {
    if (!this.connected) {
      await this.connect();
    }

    this.emit('sending', { localPath, remotePath });

    try {
      await this.client.put(localPath, remotePath);

      this.stats.filesSent++;
      this.stats.lastSendTime = new Date();

      this.emit('sent', { localPath, remotePath });
      return { success: true, remotePath };

    } catch (error) {
      this.stats.filesErrored++;
      this.emit('sendError', { localPath, remotePath, error });
      throw error;
    }
  }

  /**
   * Send content directly without local file
   */
  async sendContent(content, remotePath) {
    if (!this.connected) {
      await this.connect();
    }

    this.emit('sending', { remotePath });

    try {
      await this.client.putContent(content, remotePath);

      this.stats.filesSent++;
      this.stats.lastSendTime = new Date();

      this.emit('sent', { remotePath });
      return { success: true, remotePath };

    } catch (error) {
      this.stats.filesErrored++;
      this.emit('sendError', { remotePath, error });
      throw error;
    }
  }

  /**
   * Send multiple files
   */
  async sendFiles(files) {
    const results = [];

    for (const { localPath, remotePath } of files) {
      try {
        const result = await this.sendFile(localPath, remotePath);
        results.push(result);
      } catch (error) {
        results.push({ success: false, localPath, remotePath, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get sender status
   */
  getStatus() {
    return {
      connected: this.connected,
      stats: this.stats
    };
  }
}

/**
 * EDI File Poller - specialized for EDI documents
 */
export class EDIFilePoller extends FilePoller {
  constructor(config) {
    super({
      ...config,
      filePattern: config.filePattern || '*.edi|*.x12|*.txt'
    });

    this.ediParser = config.ediParser;
  }

  /**
   * Override to parse EDI content
   */
  async processFile(file) {
    const remotePath = path.join(this.config.remotePath, file.name);

    this.emit('processingFile', { file: file.name, path: remotePath });

    try {
      // Download file content
      const content = await this.client.getContent(remotePath);

      // Parse EDI if parser provided
      let parsedContent = null;
      if (this.ediParser) {
        parsedContent = this.ediParser(content);
        this.emit('ediParsed', {
          filename: file.name,
          documentType: parsedContent?.interchanges?.[0]?.groups?.[0]?.transactions?.[0]?.transactionSetId,
          parsed: parsedContent
        });
      }

      // Emit for external processing
      this.emit('fileReceived', {
        filename: file.name,
        path: remotePath,
        size: file.size,
        content,
        parsed: parsedContent
      });

      // Mark as processed
      this.processedFiles.add(remotePath);
      this.stats.filesProcessed++;
      this.stats.lastFileTime = new Date();

      // Handle post-processing
      if (this.config.deleteAfterProcess) {
        await this.client.delete(remotePath);
      } else if (this.config.moveAfterProcess && this.config.processedDir) {
        const archivePath = path.join(
          this.config.remotePath,
          this.config.processedDir,
          `${Date.now()}_${file.name}`
        );
        await this.client.rename(remotePath, archivePath);
      }

      this.emit('fileProcessed', { file: file.name });

    } catch (error) {
      this.stats.filesErrored++;
      this.emit('fileError', { file: file.name, error });

      // Move to error directory if configured
      if (this.config.errorDir) {
        try {
          const errorPath = path.join(
            this.config.remotePath,
            this.config.errorDir,
            `${Date.now()}_${file.name}`
          );
          await this.client.rename(remotePath, errorPath);
        } catch (moveError) {
          this.emit('error', moveError);
        }
      }
    }
  }
}

export { FilePoller, FileSender, EDIFilePoller };
