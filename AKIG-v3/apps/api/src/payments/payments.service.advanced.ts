import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto';
import { PaymentCreatedEvent, PaymentCompletedEvent, PaymentFailedEvent } from './events';
import { Payment, PaymentStatus, PaymentMethod, ContractStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Circuit Breaker State Machine
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly successThreshold: number = 3,
    private readonly timeout: number = 30000,
    private readonly resetTimeout: number = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if we should move to HALF_OPEN
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new HttpException('Circuit breaker is OPEN', HttpStatus.SERVICE_UNAVAILABLE);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        this.timeoutPromise(this.timeout),
      ]);

      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Circuit breaker timeout')), ms),
    );
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Payments Service with Idempotence & Circuit Breaker Pattern
 */
@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly orangeMoneyBreaker: CircuitBreaker;
  private readonly stripeBreaker: CircuitBreaker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize circuit breakers
    this.orangeMoneyBreaker = new CircuitBreaker(5, 3, 30000, 60000);
    this.stripeBreaker = new CircuitBreaker(3, 2, 10000, 30000);
  }

  async onModuleInit() {
    await this.initializeReceiptCounter();
    this.logger.log('PaymentsService initialized with Circuit Breakers');
  }

  /**
   * Create payment with strict idempotence
   */
  async createPayment(
    dto: CreatePaymentDto,
    createdBy: string,
    idempotenceKey: string,
  ): Promise<PaymentResponseDto> {
    if (!idempotenceKey) {
      throw new BadRequestException('X-Idempotence-Key header required');
    }

    // Check idempotence (Redis SETNX atomic)
    const lockKey = `payment:idempotence:${idempotenceKey}`;
    const isNew = await this.redis.set(lockKey, 'PROCESSING', 'EX', 3600, 'NX');

    if (!isNew) {
      // Already processed: return existing payment
      const paymentId = await this.redis.get(lockKey);
      if (paymentId && paymentId !== 'PROCESSING') {
        const existing = await this.findById(paymentId);
        if (existing) {
          this.logger.log(`Idempotence: returning existing payment ${paymentId}`);
          return this.toResponseDto(existing);
        }
      }
      // Still processing: wait
      return this.waitForProcessing(idempotenceKey);
    }

    try {
      // Validate business rules in transaction
      await this.validatePaymentRequest(dto);

      // Create payment
      const payment = await this.prisma.payment.create({
        data: {
          amount: dto.amount,
          method: dto.method,
          status: PaymentStatus.PENDING,
          contractId: dto.contractId,
          tenantId: dto.tenantId,
          dueDate: new Date(dto.dueDate),
          notes: dto.notes,
          createdById: createdBy,
          reference: await this.generateReceiptNumber(),
          metadata: {
            idempotenceKey,
            providerPayload: dto.providerPayload,
          },
        },
      });

      // Store idempotence mapping
      await this.redis.setex(lockKey, 86400, payment.id);

      // Emit event for async processing
      this.eventEmitter.emit('payment.created', new PaymentCreatedEvent(payment.id));

      return {
        ...this.toResponseDto(payment),
        status: PaymentStatus.PENDING,
        message: 'Payment queued for processing',
        processingUrl: `/api/v1/payments/${payment.id}/status`,
      };
    } catch (error) {
      // Cleanup on error
      await this.redis.del(lockKey);
      throw error;
    }
  }

  /**
   * Process payment via provider with circuit breaker
   */
  async processPayment(paymentId: string): Promise<void> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    // Idempotence: skip if already processed
    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(`Payment ${paymentId} already processed: ${payment.status}`);
      return;
    }

    // Update to PROCESSING
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    try {
      // Call provider via circuit breaker
      let providerResponse: any;

      switch (payment.method) {
        case PaymentMethod.ORANGE_MONEY:
          providerResponse = await this.orangeMoneyBreaker.execute(() =>
            this.callOrangeMoneyAPI(payment),
          );
          break;

        case PaymentMethod.STRIPE:
          providerResponse = await this.stripeBreaker.execute(() =>
            this.callStripeAPI(payment),
          );
          break;

        case PaymentMethod.CASH:
        case PaymentMethod.CHECK:
          providerResponse = { status: 'completed', transactionId: `local-${uuidv4()}` };
          break;

        default:
          throw new Error(`Unsupported payment method: ${payment.method}`);
      }

      // Handle response
      await this.handleProviderResponse(paymentId, providerResponse);
    } catch (error) {
      // Circuit breaker open
      if (error.message.includes('Circuit breaker is OPEN')) {
        this.logger.error(`Circuit breaker open for ${payment.method}, failing fast`);
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            metadata: { error: `Service ${payment.method} unavailable` },
          },
        });

        this.eventEmitter.emit('payment.failed', new PaymentFailedEvent(
          paymentId,
          'Service unavailable',
          payment.method,
        ));
        throw error;
      }

      // Business error (don't retry)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            metadata: { error: error.message },
          },
        });
        return;
      }

      // Network error: let it retry
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        contract: true,
        tenant: true,
      },
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(id: string): Promise<PaymentResponseDto> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return this.toResponseDto(payment);
  }

  // ==================== PRIVATE UTILITIES ====================

  private async validatePaymentRequest(dto: CreatePaymentDto): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: { tenant: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${dto.contractId} not found`);
    }

    if (contract.tenantId !== dto.tenantId) {
      throw new BadRequestException('Tenant not assigned to this contract');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(`Contract is not active: ${contract.status}`);
    }

    // Validate amount (tolerance 10%)
    const expectedAmount = contract.rentAmount;
    if (dto.amount < expectedAmount * 0.9) {
      this.logger.warn(`Payment amount ${dto.amount} below expected ${expectedAmount}`);
    }
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `receipt:counter:${year}`;

    // Atomic increment
    const counter = await this.redis.incr(counterKey);

    // Expire at end of year
    const endOfYear = new Date(year + 1, 0, 1);
    const ttl = Math.floor((endOfYear.getTime() - Date.now()) / 1000);
    await this.redis.expire(counterKey, ttl);

    return `GNF-${year}-${counter.toString().padStart(6, '0')}`;
  }

  private async initializeReceiptCounter(): Promise<void> {
    const year = new Date().getFullYear();
    const counterKey = `receipt:counter:${year}`;
    
    const exists = await this.redis.exists(counterKey);
    if (!exists) {
      await this.redis.set(counterKey, '0');
      this.logger.log(`Initialized receipt counter for ${year}`);
    }
  }

  private async waitForProcessing(idempotenceKey: string): Promise<PaymentResponseDto> {
    const maxWait = 30000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      const paymentId = await this.redis.get(`payment:idempotence:${idempotenceKey}`);
      if (paymentId && paymentId !== 'PROCESSING') {
        const payment = await this.findById(paymentId);
        if (payment) return this.toResponseDto(payment);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Idempotence processing timeout');
  }

  private async callOrangeMoneyAPI(payment: Payment): Promise<any> {
    // Simulate API call
    this.logger.log(`Calling Orange Money API for payment ${payment.id}`);
    
    // In production: real API call with fetch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      status: 'completed',
      transactionId: `OM-${uuidv4()}`,
    };
  }

  private async callStripeAPI(payment: Payment): Promise<any> {
    // Simulate API call
    this.logger.log(`Calling Stripe API for payment ${payment.id}`);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      status: 'completed',
      transactionId: `stripe_${uuidv4()}`,
    };
  }

  private async handleProviderResponse(paymentId: string, response: any): Promise<void> {
    if (response.status === 'completed') {
      // Success: update payment and contract balance
      await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            externalId: response.transactionId,
            paidDate: new Date(),
          },
        });

        // Update contract balance
        await tx.contract.update({
          where: { id: payment.contractId },
          data: {
            balance: { increment: payment.amount },
          },
        });
      });

      // Emit success event
      const payment = await this.findById(paymentId);
      this.eventEmitter.emit('payment.completed', new PaymentCompletedEvent(
        paymentId,
        payment!.amount,
        payment!.tenantId,
      ));
    } else if (response.status === 'pending') {
      // Provider needs more time
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { externalId: response.transactionId },
      });
    } else {
      // Failed
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          metadata: { error: response.error || 'Unknown error' },
        },
      });

      this.eventEmitter.emit('payment.failed', new PaymentFailedEvent(
        paymentId,
        response.error || 'Unknown error',
        'provider',
      ));
    }
  }

  private toResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      contractId: payment.contractId,
      tenantId: payment.tenantId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      externalId: payment.externalId,
      dueDate: payment.dueDate,
      paidDate: payment.paidDate,
      receiptUrl: payment.receiptUrl,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
