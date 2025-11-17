import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PaymentsService } from '../payments.service';
import { PaymentStatus } from '@prisma/client';

/**
 * Job Interfaces
 */
export interface ProcessPaymentJob {
  paymentId: string;
  idempotenceKey: string;
  method: string;
  providerPayload: any;
}

export interface GenerateReceiptJob {
  paymentId: string;
  tenantId: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export interface CheckOverdueJob {
  dryRun?: boolean;
}

/**
 * Payments Worker with BullMQ
 * Handles async payment processing, receipt generation, and overdue checks
 */
@Processor('payments', {
  concurrency: 10,
  limiter: {
    max: 100,
    duration: 60000,
  },
  settings: {
    lockDuration: 30000,
    stalledInterval: 30000,
    maxStalledCount: 3,
  },
})
@Injectable()
export class PaymentsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paymentsService: PaymentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  /**
   * Main job processor - routes to appropriate handler
   */
  async process(job: Job): Promise<any> {
    this.logger.log(`[${job.id}] Processing job ${job.name}`);

    const startTime = Date.now();

    try {
      let result: any;

      switch (job.name) {
        case 'process-payment':
          result = await this.handleProcessPayment(job as Job<ProcessPaymentJob>);
          break;

        case 'generate-receipt':
          result = await this.handleGenerateReceipt(job as Job<GenerateReceiptJob>);
          break;

        case 'check-overdue':
          result = await this.handleCheckOverdue(job as Job<CheckOverdueJob>);
          break;

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`[${job.id}] Completed in ${duration}ms`);

      // Send metrics
      await this.sendMetrics(job.name, 'success', duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[${job.id}] Failed after ${duration}ms:`, error);

      // Send failure metrics
      await this.sendMetrics(job.name, 'failed', duration);

      // Alert ops team if final failure
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        await this.alertOpsTeam('Job failed permanently', {
          jobId: job.id,
          name: job.name,
          error: error.message,
          attempts: job.attemptsMade,
        });
      }

      throw error;
    }
  }

  /**
   * Process payment via payment service
   */
  private async handleProcessPayment(job: Job<ProcessPaymentJob>): Promise<void> {
    const { paymentId } = job.data;

    // Update progress
    await job.updateProgress(10);

    // Call payment service to process
    await this.paymentsService.processPayment(paymentId);

    await job.updateProgress(100);
  }

  /**
   * Generate PDF receipt and send notifications
   */
  private async handleGenerateReceipt(job: Job<GenerateReceiptJob>): Promise<void> {
    const { paymentId, tenantId, sendEmail, sendSMS } = job.data;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: { include: { property: true } },
        tenant: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Skip if already generated
    if (payment.receiptUrl) {
      this.logger.warn(`Receipt already exists for payment ${paymentId}`);
      return;
    }

    await job.updateProgress(20);

    // Generate PDF (simulated - in production use pdfkit/puppeteer)
    const receiptUrl = await this.generateReceiptPDF(payment);

    await job.updateProgress(60);

    // Update payment
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { receiptUrl },
    });

    await job.updateProgress(80);

    // Send notifications
    if (sendEmail && payment.tenant.email) {
      await this.sendReceiptEmail(payment.tenant.email, receiptUrl, payment);
    }

    if (sendSMS && payment.tenant.phone) {
      await this.sendReceiptSMS(payment.tenant.phone, receiptUrl, payment);
    }

    await job.updateProgress(100);
  }

  /**
   * Check for overdue payments (cron job)
   */
  private async handleCheckOverdue(job: Job<CheckOverdueJob>): Promise<void> {
    const { dryRun = false } = job.data;

    // Find payments overdue by more than 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const overduePayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: { lt: threeDaysAgo },
      },
      include: {
        tenant: true,
        contract: { include: { property: true } },
      },
      take: 100, // Process in batches
    });

    this.logger.log(`Found ${overduePayments.length} overdue payments`);

    let processedCount = 0;

    for (const payment of overduePayments) {
      if (dryRun) {
        this.logger.log(`DRY RUN: Would process payment ${payment.id}`);
        continue;
      }

      const daysOverdue = Math.floor(
        (Date.now() - payment.dueDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      // Update tenant risk score
      await this.prisma.tenant.update({
        where: { id: payment.tenantId },
        data: {
          riskScore: { increment: 0.1 },
          lastRiskUpdate: new Date(),
        },
      });

      // Create alert for manager
      this.eventEmitter.emit('notification.overdue-payment', {
        paymentId: payment.id,
        tenantName: payment.tenant.name,
        amount: payment.amount,
        daysOverdue,
      });

      // Send reminder SMS on days 3, 7, 14
      if ([3, 7, 14].includes(daysOverdue) && payment.tenant.phone) {
        await this.sendReminderSMS(payment.tenant.phone, payment, daysOverdue);
      }

      processedCount++;
      await job.updateProgress((processedCount / overduePayments.length) * 100);
    }

    // Log metrics
    await this.redis.hincrby('metrics:overdue-checks', new Date().toISOString().split('T')[0], processedCount);
  }

  // ==================== PRIVATE UTILITIES ====================

  private async generateReceiptPDF(payment: any): Promise<string> {
    // Simulate PDF generation
    this.logger.log(`Generating PDF for payment ${payment.id}`);

    // In production: use pdfkit, puppeteer, or external service
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock upload to MinIO/S3
    const filename = `receipts/${payment.id}_${Date.now()}.pdf`;
    const url = `https://storage.akig.com/${filename}`;

    this.logger.log(`Receipt generated: ${url}`);
    return url;
  }

  private async sendReceiptEmail(
    email: string,
    receiptUrl: string,
    payment: any,
  ): Promise<void> {
    this.logger.log(`Sending receipt email to ${email}`);

    // Emit event for email service
    this.eventEmitter.emit('email.send-receipt', {
      to: email,
      subject: 'Reçu de paiement - AKIG',
      template: 'payment-receipt',
      data: {
        amount: payment.amount,
        date: payment.paidDate,
        receiptUrl,
      },
    });
  }

  private async sendReceiptSMS(
    phone: string,
    receiptUrl: string,
    payment: any,
  ): Promise<void> {
    this.logger.log(`Sending receipt SMS to ${phone}`);

    // Emit event for SMS service
    this.eventEmitter.emit('sms.send', {
      phone,
      message: `Paiement de ${payment.amount} GNF reçu. Reçu: ${receiptUrl}`,
    });
  }

  private async sendReminderSMS(
    phone: string,
    payment: any,
    daysOverdue: number,
  ): Promise<void> {
    this.logger.log(`Sending reminder SMS to ${phone} (${daysOverdue} days overdue)`);

    this.eventEmitter.emit('sms.send', {
      phone,
      message: `Rappel: Paiement de ${payment.amount} GNF en retard de ${daysOverdue} jours. Veuillez régulariser.`,
    });
  }

  private async sendMetrics(
    jobName: string,
    status: 'success' | 'failed',
    duration: number,
  ): Promise<void> {
    try {
      // Store in Redis for Prometheus
      const metricKey = `metrics:jobs:${jobName}:${status}`;
      await this.redis.hincrby(metricKey, 'count', 1);
      await this.redis.hincrby(metricKey, 'total_duration', duration);

      // Store in TimescaleDB (if available)
      await this.prisma.metric.create({
        data: {
          name: 'job_duration',
          value: duration / 1000,
          labels: {
            job: jobName,
            status,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send metrics: ${error.message}`);
    }
  }

  private async alertOpsTeam(message: string, context: any): Promise<void> {
    this.logger.error(`OPS ALERT: ${message}`, context);

    // Emit event for alerting service (PagerDuty, Opsgenie, etc.)
    this.eventEmitter.emit('ops.alert', {
      severity: 'critical',
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== WORKER EVENTS ====================

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} started`);
  }
}
