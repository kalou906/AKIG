import { IsEmail, IsString, IsBoolean, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { RiskCategory } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  incomeVerified?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  incomeVerified?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class TenantFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RiskCategory)
  riskCategory?: RiskCategory;

  @IsOptional()
  @IsNumber()
  @Min(300)
  minCreditScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
