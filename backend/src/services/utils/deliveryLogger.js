const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'notification-latency.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logDelivery({ channel, recipient, template, durationMs, success, error }) {
  try {
    ensureLogDir();
    const payload = {
      timestamp: new Date().toISOString(),
      channel,
      recipient,
      template,
      durationMs,
      success,
      ...(error ? { error } : {}),
    };
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (writeError) {
    console.error('[deliveryLogger] Impossible d\'écrire dans le journal:', writeError.message);
  }
}

module.exports = { logDelivery };
