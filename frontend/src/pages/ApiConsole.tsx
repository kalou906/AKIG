/**
 * API Console - Interactive API Testing and Debugging
 * Features: Request history, syntax highlighting, response formatting,
 * endpoint browser, authentication, and request/response inspection
 */

import React, { useState, useCallback, useMemo } from 'react';
import styles from './ApiConsole.module.css';

interface RequestHistory {
  id: string;
  timestamp: number;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: string;
  status?: number;
  responseTime?: number;
  response?: any;
  error?: string;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requiresAuth: boolean;
  category: string;
}

// Available API endpoints
const API_ENDPOINTS: ApiEndpoint[] = [
  { method: 'GET', path: '/api/dev/me', description: 'Current user info', requiresAuth: true, category: 'Profile' },
  { method: 'GET', path: '/api/dev/tokens', description: 'List API tokens', requiresAuth: true, category: 'Tokens' },
  { method: 'POST', path: '/api/dev/tokens', description: 'Create API token', requiresAuth: true, category: 'Tokens' },
  { method: 'GET', path: '/api/dev/tokens/:id', description: 'Get token details', requiresAuth: true, category: 'Tokens' },
  { method: 'DELETE', path: '/api/dev/tokens/:id', description: 'Revoke token', requiresAuth: true, category: 'Tokens' },
  { method: 'GET', path: '/api/contracts', description: 'List contracts', requiresAuth: true, category: 'Contracts' },
  { method: 'POST', path: '/api/contracts', description: 'Create contract', requiresAuth: true, category: 'Contracts' },
  { method: 'GET', path: '/api/payments', description: 'List payments', requiresAuth: true, category: 'Payments' },
  { method: 'POST', path: '/api/payments', description: 'Process payment', requiresAuth: true, category: 'Payments' },
  { method: 'GET', path: '/api/2fa/status', description: '2FA status', requiresAuth: true, category: '2FA' },
  { method: 'POST', path: '/api/2fa/setup', description: 'Setup 2FA', requiresAuth: true, category: '2FA' },
  { method: 'GET', path: '/health/live', description: 'Server alive check', requiresAuth: false, category: 'Health' },
  { method: 'GET', path: '/health/ready', description: 'Server readiness', requiresAuth: false, category: 'Health' },
];

/**
 * Syntax Highlighter for JSON
 */
function JsonHighlight({ data }: { data: any }) {
  const highlighted = React.useMemo(() => {
    try {
      const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      return (
        <pre className={styles.jsonHighlight}>
          {json.split('\n').map((line, idx) => (
            <div key={idx} className={getLineClass(line)}>
              <span className={styles.lineNumber}>{idx + 1}</span>
              <span>{highlightJson(line)}</span>
            </div>
          ))}
        </pre>
      );
    } catch (error) {
      return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }
  }, [data]);

  return highlighted;
}

function getLineClass(line: string): string {
  if (line.includes('"') && line.includes(':')) return styles.objectLine;
  if (line.includes('[') || line.includes(']')) return styles.arrayLine;
  return '';
}

function highlightJson(line: string): React.ReactNode {
  // Simple highlighting for keys, strings, numbers, booleans
  return line
    .replace(/("[\w]+"\s*:)/g, '<span class="key">$1</span>')
    .replace(/(:\s*"[^"]*")/g, '<span class="string">$1</span>')
    .replace(/(:\s*\d+)/g, '<span class="number">$1</span>')
    .replace(/(true|false|null)/g, '<span class="boolean">$1</span>');
}

/**
 * Endpoint Browser Component
 */
function EndpointBrowser({ onSelect }: { onSelect: (endpoint: string, method: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('Profile');

  const categories = useMemo(() => {
    const cats = new Set(API_ENDPOINTS.map(e => e.category));
    return Array.from(cats).sort();
  }, []);

  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter(e => e.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className={styles.endpointBrowser}>
      <h3>API Endpoints</h3>
      
      <div className={styles.categoryTabs}>
        {categories.map(category => (
          <button
            key={category}
            className={selectedCategory === category ? styles.active : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.endpointList}>
        {filteredEndpoints.map(endpoint => (
          <div
            key={`${endpoint.method}-${endpoint.path}`}
            className={styles.endpointItem}
            onClick={() => onSelect(endpoint.path, endpoint.method)}
          >
            <span className={`${styles.method} ${styles[endpoint.method.toLowerCase()]}`}>
              {endpoint.method}
            </span>
            <div>
              <div className={styles.path}>{endpoint.path}</div>
              <div className={styles.description}>{endpoint.description}</div>
              {endpoint.requiresAuth && <span className={styles.authBadge}>🔒 Auth</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Request Builder Component
 */
function RequestBuilder({
  endpoint,
  method,
  body,
  token,
  onEndpointChange,
  onMethodChange,
  onBodyChange,
  onTokenChange,
  onSend,
  isLoading,
}: {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: string;
  token: string;
  onEndpointChange: (v: string) => void;
  onMethodChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onTokenChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
}) {
  return (
    <div className={styles.requestBuilder}>
      <h3>Request</h3>

      <div className={styles.methodEndpoint}>
        <select
          value={method}
          onChange={e => onMethodChange(e.target.value)}
          className={`${styles.method} ${styles[method.toLowerCase()]}`}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>

        <input
          type="text"
          value={endpoint}
          onChange={e => onEndpointChange(e.target.value)}
          placeholder="e.g., /api/dev/me"
          className={styles.endpointInput}
        />
      </div>

      <div className={styles.headers}>
        <h4>Headers</h4>
        <div className={styles.headerItem}>
          <span>Content-Type</span>
          <span>application/json</span>
        </div>
        <div className={styles.headerItem}>
          <span>Authorization</span>
          <input
            type="password"
            value={token}
            onChange={e => onTokenChange(e.target.value)}
            placeholder="x-api-token or Bearer token"
            className={styles.tokenInput}
          />
        </div>
      </div>

      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div className={styles.bodySection}>
          <h4>Body</h4>
          <textarea
            value={body}
            onChange={e => onBodyChange(e.target.value)}
            placeholder='{"key": "value"}'
            className={styles.bodyEditor}
            rows={8}
          />
        </div>
      )}

      <button
        onClick={onSend}
        disabled={isLoading}
        className={styles.sendButton}
      >
        {isLoading ? 'Sending...' : 'Send Request'}
      </button>
    </div>
  );
}

/**
 * Response Viewer Component
 */
function ResponseViewer({ request }: { request: RequestHistory | null }) {
  if (!request) {
    return (
      <div className={styles.responseViewer}>
        <div className={styles.emptyState}>
          <p>No response yet. Send a request to see results.</p>
        </div>
      </div>
    );
  }

  const statusClass = request.status
    ? request.status < 400 ? styles.success : request.status < 500 ? styles.warning : styles.error
    : styles.error;

  return (
    <div className={styles.responseViewer}>
      <div className={styles.responseHeader}>
        <div>
          <span className={`${styles.status} ${statusClass}`}>
            {request.status || 'ERROR'}
          </span>
          <span className={styles.time}>
            {request.responseTime}ms
          </span>
        </div>
        {request.error && <span className={styles.error}>{request.error}</span>}
      </div>

      {request.response && (
        <div className={styles.responseBody}>
          <h4>Response Body</h4>
          <JsonHighlight data={request.response} />
        </div>
      )}
    </div>
  );
}

/**
 * History Component
 */
function HistoryPanel({ history, onSelect }: { history: RequestHistory[]; onSelect: (req: RequestHistory) => void }) {
  return (
    <div className={styles.history}>
      <h3>History</h3>
      <div className={styles.historyList}>
        {history.length === 0 ? (
          <p className={styles.empty}>No requests yet</p>
        ) : (
          history.map(req => (
            <div
              key={req.id}
              className={styles.historyItem}
              onClick={() => onSelect(req)}
            >
              <span className={`${styles.method} ${styles[req.method.toLowerCase()]}`}>
                {req.method}
              </span>
              <span className={styles.path}>{req.endpoint}</span>
              <span className={`${styles.status} ${req.status ? (req.status < 400 ? styles.success : styles.error) : ''}`}>
                {req.status || '—'}
              </span>
              <span className={styles.time}>
                {new Date(req.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main API Console Component
 */
export default function ApiConsole() {
  // State
  const [endpoint, setEndpoint] = useState('/api/dev/me');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [body, setBody] = useState('{}');
  const [token, setToken] = useState(localStorage.getItem('api_token') || '');
  const [currentResponse, setCurrentResponse] = useState<RequestHistory | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Save token to localStorage
  const handleTokenChange = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem('api_token', newToken);
  }, []);

  // Send request
  const sendRequest = useCallback(async () => {
    if (!endpoint) {
      alert('Please enter an endpoint');
      return;
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    setIsLoading(true);

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'x-api-token': token,
        };
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
      }

      const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const response = await fetch(`${baseUrl}${endpoint}`, options);

      const responseTime = Math.round(performance.now() - startTime);
      const responseBody = await response.json();

      const request: RequestHistory = {
        id: requestId,
        timestamp: Date.now(),
        method,
        endpoint,
        body,
        status: response.status,
        responseTime,
        response: responseBody,
      };

      setCurrentResponse(request);
      setHistory(prev => [request, ...prev].slice(0, 50)); // Keep last 50
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      const request: RequestHistory = {
        id: requestId,
        timestamp: Date.now(),
        method,
        endpoint,
        body,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setCurrentResponse(request);
      setHistory(prev => [request, ...prev].slice(0, 50));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, method, body, token]);

  // Handle endpoint selection
  const handleSelectEndpoint = useCallback((selectedEndpoint: string, selectedMethod: string) => {
    setEndpoint(selectedEndpoint);
    setMethod(selectedMethod as any);

    // Clear body for GET requests
    if (selectedMethod === 'GET') {
      setBody('{}');
    }
  }, []);

  return (
    <div className={styles.apiConsole}>
      <div className={styles.header}>
        <h1>API Console</h1>
        <p className={styles.subtitle}>Interactive API testing and debugging</p>
      </div>

      <div className={styles.container}>
        <div className={styles.sidebar}>
          <EndpointBrowser onSelect={handleSelectEndpoint} />
          <HistoryPanel history={history} onSelect={setCurrentResponse} />
        </div>

        <div className={styles.main}>
          <div className={styles.requestPanel}>
            <RequestBuilder
              endpoint={endpoint}
              method={method}
              body={body}
              token={token}
              onEndpointChange={setEndpoint}
              onMethodChange={(v) => setMethod(v as any)}
              onBodyChange={setBody}
              onTokenChange={handleTokenChange}
              onSend={sendRequest}
              isLoading={isLoading}
            />
          </div>

          <div className={styles.responsePanel}>
            <ResponseViewer request={currentResponse} />
          </div>
        </div>
      </div>
    </div>
  );
}
