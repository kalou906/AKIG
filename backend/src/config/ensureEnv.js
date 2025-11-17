// Ensure required environment variables are present at startup
// Fails fast in CI/CD or runtime if critical configuration missing.

const required = ['DATABASE_URL', 'JWT_SECRET'];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('[CONFIG] Missing env vars:', missing.join(', '));
  // Exit non-zero to fail startup when configuration is invalid
  process.exit(1);
}
