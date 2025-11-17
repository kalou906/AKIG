/**
 * Offline Request Queue
 * Manages pending requests when offline and replays them on reconnection
 * Includes conflict detection, retry logic, and local storage persistence
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Types
 */
export interface PendingRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: Record<string, any>;
  headers?: Record<string, string>;
  priority: 'low' | 'normal' | 'high';
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  expiresAt: number;
  retryAfter?: number;
  tags?: string[];
  dependsOn?: string; // ID of another request this depends on
}

export interface QueueStats {
  total: number;
  pending: number;
  failed: number;
  highPriority: number;
  oldestRequest: number;
  youngestRequest: number;
}

export interface ReplayResult {
  successCount: number;
  failureCount: number;
  skippedCount: number;
  details: {
    id: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    error?: string;
  }[];
}

/**
 * Offline Queue Manager
 */
class OfflineQueue {
  private store: PendingRequest[] = [];
  private storageKey = 'akig_offline_queue';
  private maxQueueSize = 100;
  private maxRetries = 5;
  private requestTimeout = 30000; // 30 seconds
  private maxRequestAge = 24 * 60 * 60 * 1000; // 24 hours
  private isLoading = false;
  private listeners: ((queue: PendingRequest[]) => void)[] = [];

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize queue from local storage
   */
  async initialize(): Promise<void> {
    try {
      this.isLoading = true;
      const stored = await AsyncStorage.getItem(this.storageKey);
      this.store = stored ? JSON.parse(stored) : [];
      
      // Clean up expired requests
      this.cleanupExpired();
      
      console.log(`[OfflineQueue] Initialized with ${this.store.length} pending requests`);
    } catch (error) {
      console.error('[OfflineQueue] Initialization error:', error);
      this.store = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add request to queue
   */
  enqueue(
    url: string,
    method: PendingRequest['method'],
    body: Record<string, any>,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      tags?: string[];
      dependsOn?: string;
    }
  ): string {
    // Check queue size
    if (this.store.length >= this.maxQueueSize) {
      console.warn('[OfflineQueue] Queue is full, removing oldest low-priority request');
      this.removeOldestLowPriority();
    }

    const requestId = this.generateId();
    const now = Date.now();

    const request: PendingRequest = {
      id: requestId,
      url,
      method,
      body,
      priority: options?.priority || 'normal',
      timestamp: now,
      attempts: 0,
      maxAttempts: this.maxRetries,
      expiresAt: now + this.maxRequestAge,
      tags: options?.tags,
      dependsOn: options?.dependsOn,
    };

    this.store.push(request);
    this.persist();
    this.notifyListeners();

    console.log(`[OfflineQueue] Enqueued: ${method} ${url} (ID: ${requestId})`);

    return requestId;
  }

  /**
   * Remove specific request from queue
   */
  dequeue(id: string): boolean {
    const index = this.store.findIndex(r => r.id === id);
    if (index > -1) {
      this.store.splice(index, 1);
      this.persist();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const timestamps = this.store.map(r => r.timestamp);
    return {
      total: this.store.length,
      pending: this.store.filter(r => r.attempts === 0).length,
      failed: this.store.filter(r => r.attempts > 0).length,
      highPriority: this.store.filter(r => r.priority === 'high').length,
      oldestRequest: timestamps.length ? Math.min(...timestamps) : 0,
      youngestRequest: timestamps.length ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Get all pending requests
   */
  getPending(): PendingRequest[] {
    return [...this.store];
  }

  /**
   * Get requests by tag
   */
  getByTag(tag: string): PendingRequest[] {
    return this.store.filter(r => r.tags?.includes(tag));
  }

  /**
   * Replay all pending requests
   */
  async replay(token: string): Promise<ReplayResult> {
    console.log(`[OfflineQueue] Starting replay of ${this.store.length} requests`);

    // Sort by priority and dependencies
    const sorted = this.sortByPriority();
    const details: ReplayResult['details'] = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const request of sorted) {
      // Skip if dependency failed
      if (request.dependsOn && !this.isRequestSuccessful(request.dependsOn)) {
        details.push({
          id: request.id,
          status: 'skipped',
          error: `Dependency ${request.dependsOn} did not complete successfully`,
        });
        skippedCount++;
        continue;
      }

      // Check retry backoff
      if (request.lastAttemptAt && request.retryAfter) {
        const timeSinceLastAttempt = Date.now() - request.lastAttemptAt;
        if (timeSinceLastAttempt < request.retryAfter) {
          details.push({
            id: request.id,
            status: 'skipped',
            error: `Retry backoff active (${request.retryAfter - timeSinceLastAttempt}ms remaining)`,
          });
          skippedCount++;
          continue;
        }
      }

      // Check max attempts
      if (request.attempts >= request.maxAttempts) {
        details.push({
          id: request.id,
          status: 'failed',
          error: `Max retries (${request.maxAttempts}) exceeded`,
        });
        failureCount++;
        continue;
      }

      try {
        const result = await this.executeRequest(request, token);
        
        if (result.ok) {
          this.dequeue(request.id);
          details.push({
            id: request.id,
            status: 'success',
            statusCode: result.statusCode,
          });
          successCount++;
        } else {
          // Increment attempt counter
          request.attempts++;
          request.lastAttemptAt = Date.now();
          
          // Exponential backoff: 2^attempts seconds
          request.retryAfter = Math.min(
            Math.pow(2, request.attempts) * 1000,
            60000 // Max 60 seconds
          );

          details.push({
            id: request.id,
            status: 'failed',
            statusCode: result.statusCode,
            error: result.error,
          });
          failureCount++;
        }
      } catch (error) {
        request.attempts++;
        request.lastAttemptAt = Date.now();
        request.retryAfter = Math.pow(2, request.attempts) * 1000;

        details.push({
          id: request.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failureCount++;
      }

      // Persist after each request in case of interruption
      this.persist();
      this.notifyListeners();
    }

    console.log(
      `[OfflineQueue] Replay complete: ${successCount} successful, ${failureCount} failed, ${skippedCount} skipped`
    );

    return {
      successCount,
      failureCount,
      skippedCount,
      details,
    };
  }

  /**
   * Execute single request with retry and timeout
   */
  private async executeRequest(
    request: PendingRequest,
    token: string
  ): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(request.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers,
        body: JSON.stringify(request.body),
        signal: controller.signal,
      });

      return {
        ok: response.ok,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Clear all requests (with optional tag filter)
   */
  clear(tag?: string): number {
    if (tag) {
      const removed = this.store.filter(r => !r.tags?.includes(tag)).length;
      this.store = this.store.filter(r => !r.tags?.includes(tag));
      console.log(`[OfflineQueue] Cleared ${removed} requests with tag: ${tag}`);
    } else {
      const removed = this.store.length;
      this.store = [];
      console.log(`[OfflineQueue] Cleared all ${removed} requests`);
    }
    
    this.persist();
    this.notifyListeners();
    return this.store.length;
  }

  /**
   * Remove request with oldest timestamp and low priority
   */
  private removeOldestLowPriority(): void {
    const lowPriorityRequests = this.store
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.priority === 'low')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (lowPriorityRequests.length > 0) {
      const toRemove = lowPriorityRequests[0];
      this.store.splice(toRemove.idx, 1);
      console.log(`[OfflineQueue] Removed oldest low-priority request: ${toRemove.id}`);
    }
  }

  /**
   * Sort requests by priority and dependencies
   */
  private sortByPriority(): PendingRequest[] {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    return [...this.store].sort((a, b) => {
      // High-priority requests first
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Requests without dependencies before those with dependencies
      if ((a.dependsOn ? 1 : 0) !== (b.dependsOn ? 1 : 0)) {
        return (a.dependsOn ? 1 : 0) - (b.dependsOn ? 1 : 0);
      }
      // Older requests first
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Check if request was successful (for dependency resolution)
   */
  private isRequestSuccessful(id: string): boolean {
    const request = this.store.find(r => r.id === id);
    // If request is not in queue, assume it was successful (removed after completion)
    return !request || request.attempts === 0;
  }

  /**
   * Clean up expired requests
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const before = this.store.length;
    this.store = this.store.filter(r => r.expiresAt > now);
    
    if (this.store.length < before) {
      console.log(`[OfflineQueue] Cleaned up ${before - this.store.length} expired requests`);
      this.persist();
    }
  }

  /**
   * Persist queue to local storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.store));
    } catch (error) {
      console.error('[OfflineQueue] Persistence error:', error);
    }
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: PendingRequest[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all subscribers
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.store]));
  }

  /**
   * Export queue for debugging
   */
  async exportQueue(): Promise<string> {
    return JSON.stringify({
      timestamp: Date.now(),
      stats: this.getStats(),
      requests: this.store,
    }, null, 2);
  }

  /**
   * Import queue from backup
   */
  async importQueue(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.requests)) {
        this.store = parsed.requests;
        await this.persist();
        this.notifyListeners();
        console.log(`[OfflineQueue] Imported ${this.store.length} requests from backup`);
        return true;
      }
    } catch (error) {
      console.error('[OfflineQueue] Import error:', error);
    }
    return false;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Hook: Use offline queue in React components
 */
export function useOfflineQueue() {
  const [queue, setQueue] = React.useState([]);
  const [stats, setStats] = React.useState(getEmptyStats());

  React.useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(requests => {
      setQueue(requests);
      setStats(offlineQueue.getStats());
    });

    return unsubscribe;
  }, []);

  return { queue, stats };
}

function getEmptyStats(): QueueStats {
  return {
    total: 0,
    pending: 0,
    failed: 0,
    highPriority: 0,
    oldestRequest: 0,
    youngestRequest: 0,
  };
}

/**
 * Network state monitoring and auto-sync
 */
export function useOfflineQueueSync(token: string | null) {
  const netInfo = useNetInfo();
  const { queue } = useOfflineQueue();

  React.useEffect(() => {
    if (netInfo.isConnected && token && queue.length > 0) {
      console.log('[OfflineQueue] Network restored, replaying queue...');
      offlineQueue.replay(token).then(result => {
        console.log('[OfflineQueue] Replay result:', result);
      });
    }
  }, [netInfo.isConnected, token]);
}

