import 'reflect-metadata';
import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 8000;

async function bootstrap() {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Metrics available at http://localhost:${PORT}/metrics`);
    });
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
