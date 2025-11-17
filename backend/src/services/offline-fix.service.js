/**
 * 📱 AKIG Offline-First Module
 * Progressive Web App (PWA) capabilities
 */

const crypto = require('crypto');

class OfflineService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.maxQueueSize = 1000;
  }

  /**
   * Get client offline module
   */
  getClientOfflineModule() {
    return `
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
        resolve(this.db);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  static setupNetworkListeners() {
    window.addEventListener('online', () => this.syncWithServer());
    window.addEventListener('offline', () => console.log('Offline mode'));
  }

  static async saveForOffline(data, category = 'tasks') {
    const tx = this.db.transaction(category, 'readwrite');
    const store = tx.objectStore(category);
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
  }

  static async getOfflineData(category = 'tasks', id = null) {
    const tx = this.db.transaction(category, 'readonly');
    const store = tx.objectStore(category);
    if (id) {
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
      });
    } else {
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      });
    }
  }

  static async syncWithServer() {
    if (!navigator.onLine) return;
    const items = await this.getOfflineData('syncQueue');
    for (const item of items) {
      await this.syncItem(item);
    }
  }

  static async syncItem(item) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (response.ok) {
        const tx = this.db.transaction('syncQueue', 'readwrite');
        tx.objectStore('syncQueue').delete(item.id);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }

  static startPeriodicSync() {
    setInterval(() => {
      if (navigator.onLine) this.syncWithServer();
    }, 5 * 60 * 1000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => OfflineService.init());
} else {
  OfflineService.init();
}
`;
  }

  /**
   * Queue sync item
   */
  async queueSyncItem(userId, action, data, metadata = {}) {
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
    return item;
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(userId) {
    const userQueue = this.syncQueue.filter(
      item => item.userId === userId && item.status === 'PENDING'
    );

    for (const item of userQueue) {
      try {
        item.status = 'COMPLETED';
      } catch (err) {
        item.retries++;
        if (item.retries < 3) {
          item.status = 'PENDING';
        } else {
          item.status = 'FAILED';
        }
      }
    }

    this.syncQueue = this.syncQueue.filter(item => item.status !== 'COMPLETED');

    return {
      processed: userQueue.filter(i => i.status === 'COMPLETED').length,
      failed: userQueue.filter(i => i.status === 'FAILED').length
    };
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

module.exports = new OfflineService();
