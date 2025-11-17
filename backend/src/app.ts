import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import tenantsRouter from './routes/tenants/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/tenants', tenantsRouter);

app.use(errorHandler);

export default app;
