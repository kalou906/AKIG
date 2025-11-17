import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

/**
 * Email Service with template support
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Send email with template
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`Sending email to ${options.to}: ${options.subject}`);

    try {
      // In production: use nodemailer, SendGrid, AWS SES, etc.
      // For now, simulate sending
      await this.simulateEmailSend(options);

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Email send failed:`, error);
      throw error;
    }
  }

  /**
   * Event handler: Send receipt email
   */
  @OnEvent('email.send-receipt')
  async handleSendReceipt(event: any) {
    await this.sendEmail({
      to: event.to,
      subject: event.subject,
      template: event.template,
      data: event.data,
    });
  }

  /**
   * Send welcome email to new tenant
   */
  async sendWelcomeEmail(email: string, tenantName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Bienvenue chez AKIG',
      template: 'welcome-tenant',
      data: {
        tenantName,
        loginUrl: process.env.FRONTEND_URL,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Réinitialisation de mot de passe - AKIG',
      template: 'password-reset',
      data: {
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });
  }

  private async simulateEmailSend(options: EmailOptions): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production: implement real email sending
    this.logger.debug(`Email payload:`, {
      to: options.to,
      subject: options.subject,
      template: options.template,
    });
  }
}
