import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'clxxx123456', description: 'Contract ID' })
  @IsString()
  contractId: string;

  @ApiProperty({ example: 'clxxx789012', description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 2500000, description: 'Payment amount in GNF' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: 'ORANGE_MONEY' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: '2025-12-01', description: 'Due date for payment' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Monthly rent for December' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Provider-specific payload (Orange Money, Stripe, etc.)' })
  @IsOptional()
  @IsObject()
  providerPayload?: any;
}

export class ProcessPaymentDto {
  @ApiProperty({ example: 'clxxx123456' })
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 'uuid-idempotence-key' })
  @IsString()
  idempotenceKey: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  method: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  externalId?: string;

  @ApiProperty()
  dueDate: Date;

  @ApiPropertyOptional()
  paidDate?: Date;

  @ApiPropertyOptional()
  receiptUrl?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  processingUrl?: string;
}
