import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RiskCategory {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class TenantFiltersDto {
  @ApiPropertyOptional({ example: 'Diallo', description: 'Search in name, email, phone, ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: ['LOW', 'MEDIUM'], enum: RiskCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RiskCategory, { each: true })
  riskCategory?: RiskCategory[];

  @ApiPropertyOptional({ example: 600, description: 'Minimum credit score' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(300)
  @Max(850)
  minCreditScore?: number;

  @ApiPropertyOptional({ example: true, description: 'Filter by contract existence' })
  @IsOptional()
  @Type(() => Boolean)
  hasContract?: boolean;

  @ApiPropertyOptional({ example: 'Conakry', description: 'Filter by city/region' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z', description: 'Get tenants updated since' })
  @IsOptional()
  @IsDateString()
  updatedSince?: Date;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'riskScore' | 'creditScore' | 'paymentCount' | 'contractCount';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 20, description: 'Page size (max 100)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'clxxx123456', description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
