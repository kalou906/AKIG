import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface RiskPrediction {
  score: number;
  category: string;
  confidence: number;
  factors: Record<string, number>;
  modelVersion: string;
  predictedAt: Date;
}

export interface PaymentStats {
  total: number;
  onTimeRate: number;
  averageDelayDays: number;
}

export interface HATEOASLinks {
  self: string;
  contracts: string;
  payments: string;
  documents: string;
  riskReport: string;
}

export class TenantResponseDto {
  @ApiProperty({ example: 'clxxx123456' })
  id: string;

  @ApiProperty({ example: 'Mamadou Diallo' })
  name: string;

  @ApiPropertyOptional({ example: 'mamadou.diallo@example.com' })
  email?: string;

  @ApiProperty({ example: '+224 620 12 34 56' })
  phone: string;

  @ApiPropertyOptional({ example: '12 345 678 90' })
  idNumber?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  occupation?: string;

  @ApiPropertyOptional({ example: 5000000 })
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 750 })
  creditScore?: number;

  @ApiPropertyOptional()
  emergencyContact?: any;

  @ApiPropertyOptional({ example: 0.25 })
  riskScore?: number;

  @ApiPropertyOptional({ example: '2025-11-14T10:00:00Z' })
  lastRiskUpdate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ example: '2025-11-14T08:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-14T10:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'AI risk prediction data' })
  riskPrediction?: RiskPrediction;

  @ApiPropertyOptional({ description: 'Payment statistics' })
  paymentStats?: PaymentStats;

  @ApiPropertyOptional({ description: 'HATEOAS links' })
  _links?: HATEOASLinks;

  @ApiPropertyOptional({ description: 'Contract count' })
  _count?: {
    contracts: number;
    payments: number;
  };
}

export class TenantListResponseDto {
  @ApiProperty({ type: [TenantResponseDto] })
  items: TenantResponseDto[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiPropertyOptional({ example: ['Diallo', 'Bah', 'Camara'] })
  suggestions?: string[];

  @ApiPropertyOptional({ example: 'clxxx789012' })
  nextCursor?: string;
}
