/**
 * AKIG Backend API - Server Entry Point
 * Separated concerns: app.js handles Express setup, index.js handles server startup only
 */

// Ensure configuration present before app boot
require('./config/ensureEnv');
// Activer les jobs cron clés (facturation/rappels)
try {
    require('./jobs/billing');
} catch (e) {
    // Safe fallback si non critique
    console.warn('Jobs billing non chargés:', e?.message);
}
const app = require('./app');

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server = null;

// Only start server if not in test mode
if (NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 AKIG Backend API Started                      ║
╚════════════════════════════════════════════════════════════╝

📊 Configuration:
    Node Env:       ${NODE_ENV}
    Port:           ${PORT}
    Timestamp:      ${new Date().toISOString()}

🔗 URL: http://localhost:${PORT}/api
        `);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
        console.log('\n⛔ SIGTERM received - shutting down gracefully...');
        if (server) {
            server.close(() => {
                console.log('✓ Server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
}

module.exports = app;
module.exports.server = server;
