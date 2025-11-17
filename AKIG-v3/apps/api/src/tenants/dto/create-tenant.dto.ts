import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, Min, Max, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EmergencyContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+224 620 00 00 00' })
  @IsString()
  @Matches(/^\+224\s?6\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, {
    message: 'Invalid Guinean phone format. Expected: +224 6xx xx xx xx',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'Brother' })
  @IsOptional()
  @IsString()
  relationship?: string;
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Mamadou Diallo', description: 'Full name of tenant' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'mamadou.diallo@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+224 620 12 34 56' })
  @IsString()
  @Matches(/^\+224\s?6\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, {
    message: 'Invalid Guinean phone format. Expected: +224 6xx xx xx xx',
  })
  phone: string;

  @ApiPropertyOptional({ example: '12 345 678 90', description: 'Guinean national ID' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\s?\d{3}\s?\d{3}\s?\d{2}$/, {
    message: 'Invalid Guinean national ID format. Expected: XX XXX XXX XX',
  })
  idNumber?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 5000000, description: 'Monthly income in GNF' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 750, description: 'Credit score (300-850)' })
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

  @ApiPropertyOptional({ example: 'Reliable tenant, always pays on time' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false, description: 'Auto-generate welcome documents' })
  @IsOptional()
  @IsBoolean()
  generateWelcomeDocuments?: boolean;

  @ApiPropertyOptional({ example: 'email', description: 'Preferred contact method (email, sms, both)' })
  @IsOptional()
  @IsString()
  preferredContactMethod?: 'email' | 'sms' | 'both';
}
