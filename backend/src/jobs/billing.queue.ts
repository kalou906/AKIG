import { Queue, Worker } from 'bullmq';
import { BillingProcessor } from './billing.processor';

export const billingQueue = new Queue('billing', {
  connection: { host: process.env.REDIS_HOST },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 }
  }
});

const processor = new BillingProcessor();

export const billingWorker = new Worker('billing', async job => {
  switch (job.name) {
    case 'generate-invoices':
      return processor.processGenerateInvoices(job);
    default:
      throw new Error(`Job inconnu: ${job.name}`);
  }
}, {
  connection: { host: process.env.REDIS_HOST },
  concurrency: 5
});
