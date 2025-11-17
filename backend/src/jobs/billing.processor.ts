import { Job } from 'bullmq';
import { BillingService } from '../services/billing.service';
import redisClient from '../utils/redisCache';

export class BillingProcessor {
  private billingService = new BillingService();

  // Idempotent - peux être rejoué sans effet secondaire
  async processGenerateInvoices(job: Job<{ month: string }>): Promise<void> {
    const { month } = job.data;
    // Mutex distribué pour éviter double exécution
    const lock = await redisClient.set(`lock:billing:${month}`, '1', {
      NX: true,
      EX: 86400 // 24h
    });
    if (!lock) {
      job.log('Job déjà en cours ou terminé');
      return;
    }
    try {
      await this.billingService.generateMonthlyInvoices(month);
      await this.billingService.calculatePenalties(month);
      job.updateProgress(100);
    } finally {
      await redisClient.del(`lock:billing:${month}`);
    }
  }
}
