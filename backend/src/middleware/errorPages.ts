/**
 * Advanced Error Pages & Error Recovery
 * 
 * Handles:
 * - 404 Not Found
 * - 500 Internal Server Error
 * - 503 Service Unavailable
 * - 429 Too Many Requests
 * - Custom error views
 */

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger';

/**
 * Middleware 404 - Doit être APRÈS tous les autres routes
 */
export function notFoundHandler(req: Request, res: Response) {
  const requestId = (req as any).id || 'unknown';

  logger.warn({
    action: 'route_not_found',
    requestId,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Déterminer le type de réponse
  const acceptsJson = req.accepts('json');
  const acceptsHtml = req.accepts('html');

  if (acceptsJson && !acceptsHtml) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist',
        path: req.path,
        method: req.method,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // HTML response
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          padding: 20px;
        }
        .container {
          text-align: center;
          background: white;
          border-radius: 10px;
          padding: 60px 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 72px;
          color: #667eea;
          margin-bottom: 20px;
          font-weight: 700;
        }
        .message {
          font-size: 24px;
          color: #333;
          margin-bottom: 30px;
        }
        .description {
          font-size: 16px;
          color: #666;
          margin-bottom: 40px;
          line-height: 1.6;
        }
        .path {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
          font-family: 'Monaco', 'Courier New', monospace;
          color: #d9534f;
          word-break: break-all;
        }
        .actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        a {
          display: inline-block;
          padding: 12px 30px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: #667eea;
          color: white;
        }
        .btn-primary:hover {
          background: #5568d3;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .btn-secondary:hover {
          background: #efefef;
        }
        .request-id {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <div class="message">Page Not Found</div>
        <div class="description">
          The resource you're looking for doesn't exist or has been moved.
        </div>
        <div class="path">${req.path}</div>
        <div class="actions">
          <a href="/" class="btn-primary">Back to Home</a>
          <a href="/api/health" class="btn-secondary">API Status</a>
        </div>
        <div class="request-id">Request ID: ${requestId}</div>
      </div>
    </body>
    </html>
  `);
}

/**
 * Middleware 500 - Erreurs serveur non gérées
 */
export function internalServerErrorHandler(
  err: Error,
  req: Request,
  res: Response
) {
  const requestId = (req as any).id || 'unknown';

  logger.error({
    action: 'unhandled_error',
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const acceptsJson = req.accepts('json');
  const acceptsHtml = req.accepts('html');

  if (acceptsJson && !acceptsHtml) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // HTML response
  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>500 - Server Error</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          padding: 20px;
        }
        .container {
          text-align: center;
          background: white;
          border-radius: 10px;
          padding: 60px 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 72px;
          color: #f5576c;
          margin-bottom: 20px;
          font-weight: 700;
        }
        .message {
          font-size: 24px;
          color: #333;
          margin-bottom: 30px;
        }
        .description {
          font-size: 16px;
          color: #666;
          margin-bottom: 40px;
          line-height: 1.6;
        }
        .actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        a {
          display: inline-block;
          padding: 12px 30px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: #f5576c;
          color: white;
        }
        .btn-primary:hover {
          background: #d63d54;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .btn-secondary:hover {
          background: #efefef;
        }
        .request-id {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>500</h1>
        <div class="message">Internal Server Error</div>
        <div class="description">
          Something went wrong on our end. Our team has been notified and is working to fix it.
        </div>
        <div class="actions">
          <a href="/" class="btn-primary">Back to Home</a>
          <a href="/api/health" class="btn-secondary">Check Status</a>
        </div>
        <div class="request-id">Request ID: ${requestId}</div>
      </div>
    </body>
    </html>
  `);
}

/**
 * Middleware 503 - Service Unavailable
 */
export function serviceUnavailableHandler(req: Request, res: Response) {
  const requestId = (req as any).id || 'unknown';

  logger.warn({
    action: 'service_unavailable',
    requestId,
    reason: 'Maintenance or overload',
  });

  const acceptsJson = req.accepts('json');

  if (acceptsJson) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again later.',
        requestId,
        retryAfter: 60,
        timestamp: new Date().toISOString(),
      },
    });
  }

  res.status(503).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="60">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>503 - Service Unavailable</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #ffa500 0%, #ff6347 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          padding: 20px;
        }
        .container {
          text-align: center;
          background: white;
          border-radius: 10px;
          padding: 60px 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 { font-size: 72px; color: #ff6347; margin-bottom: 20px; }
        .message { font-size: 24px; color: #333; margin-bottom: 30px; }
        .spinner {
          margin: 30px 0;
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ff6347;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>503</h1>
        <div class="message">Service Temporarily Unavailable</div>
        <div class="spinner"></div>
        <p>We're performing maintenance. Please come back in a few moments.</p>
      </div>
    </body>
    </html>
  `);
}

/**
 * Middleware 429 - Too Many Requests
 */
export function rateLimitHandler(req: Request, res: Response) {
  const requestId = (req as any).id || 'unknown';
  const retryAfter = 60;

  logger.warn({
    action: 'rate_limit_exceeded',
    requestId,
    ip: req.ip,
    path: req.path,
  });

  res.set('Retry-After', retryAfter.toString());

  const acceptsJson = req.accepts('json');

  if (acceptsJson) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please wait before making another request.',
        requestId,
        retryAfter,
        timestamp: new Date().toISOString(),
      },
    });
  }

  res.status(429).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="${retryAfter}">
      <title>429 - Too Many Requests</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          text-align: center;
          background: white;
          padding: 60px;
          border-radius: 10px;
        }
        h1 { font-size: 72px; color: #f5576c; }
        p { margin-top: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>429</h1>
        <p>Too many requests. Please wait ${retryAfter} seconds.</p>
      </div>
    </body>
    </html>
  `);
}

/**
 * Créé les routes d'erreur
 */
export function createErrorRoutes(): Router {
  const router = Router();

  // Erreurs spécifiques
  router.get('/error/503', serviceUnavailableHandler);
  router.get('/error/429', rateLimitHandler);
  router.get('/error/500', internalServerErrorHandler);

  return router;
}

export { notFoundHandler, internalServerErrorHandler, serviceUnavailableHandler, rateLimitHandler };
