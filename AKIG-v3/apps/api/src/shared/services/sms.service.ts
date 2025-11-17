import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

export interface SMSOptions {
  phone: string;
  message: string;
}

/**
 * SMS Service for Guinean providers
 */
@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Send SMS via local provider
   */
  async send(options: SMSOptions): Promise<void> {
    this.logger.log(`Sending SMS to ${options.phone}`);

    try {
      // In production: integrate with Orange Guinea, MTN Guinea SMS API
      await this.simulateSMSSend(options);

      this.logger.log(`SMS sent successfully to ${options.phone}`);
    } catch (error) {
      this.logger.error(`SMS send failed:`, error);
      throw error;
    }
  }

  /**
   * Event handler: Send SMS
   */
  @OnEvent('sms.send')
  async handleSendSMS(event: any) {
    await this.send({
      phone: event.phone,
      message: event.message,
    });
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminder(phone: string, amount: number, daysOverdue: number): Promise<void> {
    await this.send({
      phone,
      message: `Rappel AKIG: Paiement de ${amount} GNF en retard de ${daysOverdue} jours. Veuillez régulariser.`,
    });
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    await this.send({
      phone,
      message: `Votre code de vérification AKIG: ${code}. Valide 10 minutes.`,
    });
  }

  private async simulateSMSSend(options: SMSOptions): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // In production: implement real SMS sending via Orange/MTN API
    this.logger.debug(`SMS payload:`, {
      phone: options.phone,
      message: options.message,
    });
  }
}
