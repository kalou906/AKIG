import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { SMSService } from './services/sms.service';
import { PDFService } from './services/pdf.service';
import { StorageService } from './services/storage.service';

@Global()
@Module({
  providers: [EmailService, SMSService, PDFService, StorageService],
  exports: [EmailService, SMSService, PDFService, StorageService],
})
export class SharedModule {}
