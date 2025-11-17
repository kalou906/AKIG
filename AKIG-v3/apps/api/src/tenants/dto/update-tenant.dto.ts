import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, Min, Max, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EmergencyContactDto } from './create-tenant.dto';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Mamadou Diallo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'mamadou.diallo@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+224 620 12 34 56' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '12 345 678 90' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 750 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether income has been verified' })
  @IsOptional()
  @IsBoolean()
  incomeVerified?: boolean;
}
