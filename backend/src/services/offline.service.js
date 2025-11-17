/**
 * 📱 AKIG Offline-First Module
 * Progressive Web App (PWA) capabilities
 * 
 * Features:
 * - Offline data storage (IndexedDB)
 * - Automatic sync when back online
 * - Conflict resolution
 * - Data compression
 * - Sync queue management
 */

const crypto = require('crypto');
const logger = require('./logger');

class OfflineService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.maxQueueSize = 1000;
  }

  /**
   * Initialize offline service for client
   */
  static getClientOfflineModule() {
    return `
/**
 * Client-side Offline Service
 * Initialize in main app.js with: OfflineService.init()
 */

class OfflineService {
  static async init() {
    this.db = null;
    await this.openIndexedDB();
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  static async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AKIG', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB opened');
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'url' });
        }
        
        console.log('✓ IndexedDB schema created');
      };
    });
  }

  static setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🟢 Back online - starting sync');
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Offline mode activated');
    });
  }

  static async saveForOffline(data, category = 'tasks') {
    try {
      const tx = this.db.transaction(category, 'readwrite');
      const store = tx.objectStore(category);
      
      if (Array.isArray(data)) {
        data.forEach(item => store.put(item));
      } else {
        store.put(data);
      }
      
      await tx.done;
      console.log(\`✓ Saved \${Array.isArray(data) ? data.length : 1} items offline\`);
    } catch (err) {
      console.error('Error saving offline data', err);
    }
  }

  static async getOfflineData(category = 'tasks', id = null) {
    try {
      const tx = this.db.transaction(category, 'readonly');
      const store = tx.objectStore(category);
      
      if (id) {
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    } catch (err) {
      console.error('Error getting offline data', err);
      return [];
    }
  }

  static async queueForSync(action, data) {
    try {
      const tx = this.db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      
      const queueItem = {
        id: Date.now(),
        action,
        data,
        timestamp: new Date(),
        retries: 0
      };
      
      store.add(queueItem);
      console.log('📤 Action queued for sync:', action);
    } catch (err) {
      console.error('Error queuing for sync', err);
    }
  }

  static async syncWithServer() {
    if (!navigator.onLine) return;

    try {
      const tx = this.db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      
      const items = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        await this.syncItem(item);
      }

      console.log(\`✓ Synced \${items.length} items\`);
    } catch (err) {
      console.error('Error during sync', err);
    }
  }

  static async syncItem(item) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        // Remove from queue
        const tx = this.db.transaction('syncQueue', 'readwrite');
        tx.objectStore('syncQueue').delete(item.id);
        console.log('✓ Item synced:', item.action);
      } else {
        item.retries++;
        if (item.retries < 3) {
          // Retry
          await new Promise(r => setTimeout(r, 1000 * item.retries));
          await this.syncItem(item);
        }
      }
    } catch (err) {
      console.error('Error syncing item', err);
    }
  }

  static startPeriodicSync() {
    // Sync every 5 minutes if online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncWithServer();
      }
    }, 5 * 60 * 1000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => OfflineService.init());
} else {
  OfflineService.init();
}
    `;
  }

  /**
   * Queue sync item on backend
   */
  async queueSyncItem(userId, action, data, metadata = {}) {
    try {
      const item = {
        id: crypto.randomUUID(),
        userId,
        action,
        data,
        metadata,
        timestamp: new Date(),
        status: 'PENDING',
        retries: 0
      };

      this.syncQueue.push(item);
      logger.info(`📤 Sync item queued: ${action}`);

      return item;
    } catch (err) {
      logger.error('Error queuing sync item', err);
      throw err;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(userId) {
    try {
      const userQueue = this.syncQueue.filter(item => item.userId === userId && item.status === 'PENDING');

      logger.info(`🔄 Processing ${userQueue.length} sync items for user ${userId}`);

      for (const item of userQueue) {
        try {
          await this.processSyncItem(item);
          item.status = 'COMPLETED';
        } catch (err) {
          item.retries++;
          if (item.retries < 3) {
            item.status = 'PENDING'; // Retry
          } else {
            item.status = 'FAILED';
          }
          logger.warn(`Failed to sync item ${item.id}, retries: ${item.retries}`);
        }
      }

      // Clean up completed items
      this.syncQueue = this.syncQueue.filter(item => item.status !== 'COMPLETED');

      return {
        processed: userQueue.filter(i => i.status === 'COMPLETED').length,
        failed: userQueue.filter(i => i.status === 'FAILED').length
      };
    } catch (err) {
      logger.error('Error processing sync queue', err);
      throw err;
    }
  }

  /**
   * Process individual sync item
   * @private
   */
  async processSyncItem(item) {
    // Implement based on action type
    const handlers = {
      'CREATE_TASK': this.createTaskFromSync,
      'UPDATE_TASK': this.updateTaskFromSync,
      'DELETE_TASK': this.deleteTaskFromSync,
      'UPLOAD_DOCUMENT': this.uploadDocumentFromSync
    };

    const handler = handlers[item.action];
    if (!handler) {
      throw new Error(`Unknown sync action: ${item.action}`);
    }

    return await handler.call(this, item.data, item.metadata);
  }

  /**
   * Detect and resolve conflicts
   */
  async resolveConflict(localData, remoteData) {
    // Last-write-wins strategy (default)
    // In production, implement more sophisticated strategies
    const localTimestamp = new Date(localData.updatedAt).getTime();
    const remoteTimestamp = new Date(remoteData.updatedAt).getTime();

    if (localTimestamp > remoteTimestamp) {
      logger.info('Conflict resolved: using local version (newer)');
      return localData;
    } else {
      logger.info('Conflict resolved: using remote version (newer)');
      return remoteData;
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      totalQueued: this.syncQueue.length,
      pending: this.syncQueue.filter(i => i.status === 'PENDING').length,
      failed: this.syncQueue.filter(i => i.status === 'FAILED').length,
      queueUtilization: (this.syncQueue.length / this.maxQueueSize) * 100
    };
  }
}
`;
  }
}

module.exports = new OfflineService();
