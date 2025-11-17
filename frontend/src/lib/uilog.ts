/**
 * UI Event Logging utility
 * Tracks user interactions for analytics, debugging, and audit trails
 */

export interface UiLogEntry {
  event: string;
  detail: any;
  timestamp: string;
  url: string;
  userAgent: string;
}

export interface UiLogConfig {
  maxEntries?: number;
  enabled?: boolean;
  onExport?: (logs: UiLogEntry[]) => void;
}

class UiLogger {
  private logs: UiLogEntry[] = [];
  private config: Required<UiLogConfig>;

  constructor(config: UiLogConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      enabled: config.enabled ?? true,
      onExport: config.onExport ?? (() => {}),
    };

    // Clear logs on page unload to free memory
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.clear());
    }
  }

  /**
   * Log a UI event
   */
  public log(event: string, detail?: any): void {
    if (!this.config.enabled) return;

    const entry: UiLogEntry = {
      event,
      detail: detail || {},
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.logs.push(entry);

    // Keep only last N entries to avoid memory issues
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[UI Event] ${event}`, detail);
    }
  }

  /**
   * Get all logged events
   */
  public getLogs(): UiLogEntry[] {
    return this.logs.slice();
  }

  /**
   * Get logs filtered by event name
   */
  public getLogsByEvent(event: string): UiLogEntry[] {
    return this.logs.filter((log) => log.event === event).slice();
  }

  /**
   * Get logs within time range
   */
  public getLogsSince(minutes: number): UiLogEntry[] {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return this.logs.filter((log) => log.timestamp >= since).slice();
  }

  /**
   * Export logs as CSV
   */
  public exportCsv(): string {
    if (this.logs.length === 0) return 'event,timestamp,detail\n';

    const header = ['event', 'timestamp', 'detail', 'url'];
    const rows = this.logs.map((log) => [
      log.event,
      log.timestamp,
      JSON.stringify(log.detail),
      log.url,
    ]);

    return (
      header.join(',') +
      '\n' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    );
  }

  /**
   * Export logs as JSON
   */
  public exportJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
  }

  /**
   * Get statistics
   */
  public getStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const log of this.logs) {
      stats[log.event] = (stats[log.event] || 0) + 1;
    }

    return stats;
  }

  /**
   * Send logs to server (for remote analytics)
   */
  public async sendToServer(endpoint: string): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: this.logs,
          stats: this.getStats(),
        }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to send logs to server:', error);
    }
  }

  /**
   * Enable/disable logging
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Singleton instance
const uiLogger = new UiLogger();

/**
 * Log a UI event
 * @param event Event name (e.g., 'tenant_delete_click')
 * @param detail Event details (optional)
 */
export function uiLog(event: string, detail?: any): void {
  uiLogger.log(event, detail);
}

/**
 * Get all UI logs
 */
export function getUiLogs(): UiLogEntry[] {
  return uiLogger.getLogs();
}

/**
 * Get UI logs by event type
 */
export function getUiLogsByEvent(event: string): UiLogEntry[] {
  return uiLogger.getLogsByEvent(event);
}

/**
 * Get UI logs from last N minutes
 */
export function getUiLogsSince(minutes: number): UiLogEntry[] {
  return uiLogger.getLogsSince(minutes);
}

/**
 * Export logs as CSV
 */
export function exportUiLogsCsv(): string {
  return uiLogger.exportCsv();
}

/**
 * Export logs as JSON
 */
export function exportUiLogsJson(): string {
  return uiLogger.exportJson();
}

/**
 * Get UI log statistics
 */
export function getUiLogStats(): Record<string, number> {
  return uiLogger.getStats();
}

/**
 * Send logs to server
 */
export async function sendUiLogsToServer(endpoint: string): Promise<void> {
  return uiLogger.sendToServer(endpoint);
}

/**
 * Clear all logs
 */
export function clearUiLogs(): void {
  uiLogger.clear();
}

/**
 * Enable/disable UI logging
 */
export function setUiLoggingEnabled(enabled: boolean): void {
  uiLogger.setEnabled(enabled);
}

/**
 * Get current logger instance
 */
export function getUiLogger(): typeof uiLogger {
  return uiLogger;
}
