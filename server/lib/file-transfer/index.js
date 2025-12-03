/**
 * File Transfer Module
 * FTP/SFTP file transfer and polling for EDI and data exchange
 */

export {
  FileTransferClient,
  FTPClient,
  SFTPClient,
  createFileTransferClient
} from './ftp-client.js';

export {
  FilePoller,
  FileSender,
  EDIFilePoller
} from './file-poller.js';

/**
 * Integration Poller Manager
 * Manages multiple file pollers for different trading partners
 */
export class IntegrationPollerManager {
  constructor() {
    this.pollers = new Map();
    this.senders = new Map();
  }

  /**
   * Create and register a new poller
   */
  createPoller(name, config, handlers = {}) {
    const { FilePoller, EDIFilePoller } = require('./file-poller.js');

    const PollerClass = config.isEDI ? EDIFilePoller : FilePoller;
    const poller = new PollerClass(config);

    // Attach handlers
    if (handlers.onFileReceived) {
      poller.on('fileReceived', handlers.onFileReceived);
    }
    if (handlers.onError) {
      poller.on('error', handlers.onError);
      poller.on('fileError', handlers.onError);
      poller.on('pollError', handlers.onError);
    }
    if (handlers.onEDIParsed) {
      poller.on('ediParsed', handlers.onEDIParsed);
    }

    this.pollers.set(name, poller);
    return poller;
  }

  /**
   * Create and register a new sender
   */
  createSender(name, config) {
    const { FileSender } = require('./file-poller.js');
    const sender = new FileSender(config);
    this.senders.set(name, sender);
    return sender;
  }

  /**
   * Get a registered poller
   */
  getPoller(name) {
    return this.pollers.get(name);
  }

  /**
   * Get a registered sender
   */
  getSender(name) {
    return this.senders.get(name);
  }

  /**
   * Start all pollers
   */
  async startAll() {
    const results = [];
    for (const [name, poller] of this.pollers) {
      try {
        await poller.start();
        results.push({ name, status: 'started' });
      } catch (error) {
        results.push({ name, status: 'error', error: error.message });
      }
    }
    return results;
  }

  /**
   * Stop all pollers
   */
  async stopAll() {
    for (const [name, poller] of this.pollers) {
      try {
        await poller.stop();
      } catch (error) {
        console.error(`Error stopping poller ${name}:`, error);
      }
    }

    // Disconnect all senders
    for (const [name, sender] of this.senders) {
      try {
        await sender.disconnect();
      } catch (error) {
        console.error(`Error disconnecting sender ${name}:`, error);
      }
    }
  }

  /**
   * Get status of all pollers and senders
   */
  getStatus() {
    const status = {
      pollers: {},
      senders: {}
    };

    for (const [name, poller] of this.pollers) {
      status.pollers[name] = poller.getStatus();
    }

    for (const [name, sender] of this.senders) {
      status.senders[name] = sender.getStatus();
    }

    return status;
  }

  /**
   * Remove a poller
   */
  async removePoller(name) {
    const poller = this.pollers.get(name);
    if (poller) {
      await poller.stop();
      this.pollers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Remove a sender
   */
  async removeSender(name) {
    const sender = this.senders.get(name);
    if (sender) {
      await sender.disconnect();
      this.senders.delete(name);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const pollerManager = new IntegrationPollerManager();

/**
 * Configuration templates for common setups
 */
export const ConfigTemplates = {
  /**
   * Standard EDI inbound configuration
   */
  ediInbound: (host, username, password, options = {}) => ({
    connection: {
      protocol: options.protocol || 'SFTP',
      host,
      port: options.port || 22,
      username,
      password,
      ...options.connectionOptions
    },
    remotePath: options.remotePath || '/inbound',
    processedDir: options.processedDir || 'archive',
    errorDir: options.errorDir || 'error',
    pollInterval: options.pollInterval || 60000,
    filePattern: options.filePattern || '*.edi|*.x12|*.txt',
    moveAfterProcess: true,
    deleteAfterProcess: false,
    isEDI: true
  }),

  /**
   * Standard EDI outbound configuration
   */
  ediOutbound: (host, username, password, options = {}) => ({
    connection: {
      protocol: options.protocol || 'SFTP',
      host,
      port: options.port || 22,
      username,
      password,
      ...options.connectionOptions
    },
    remotePath: options.remotePath || '/outbound'
  }),

  /**
   * Data file polling configuration
   */
  dataPolling: (host, username, password, options = {}) => ({
    connection: {
      protocol: options.protocol || 'FTP',
      host,
      port: options.port || 21,
      username,
      password,
      secure: options.secure || false
    },
    remotePath: options.remotePath || '/data',
    processedDir: options.processedDir || 'processed',
    pollInterval: options.pollInterval || 300000, // 5 minutes
    filePattern: options.filePattern || '*.csv|*.xml|*.json',
    moveAfterProcess: true,
    deleteAfterProcess: false,
    isEDI: false
  })
};
