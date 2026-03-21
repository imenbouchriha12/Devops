import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  IsBoolean,
  IsObject,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
 
class AddressDto {
  @IsOptional() @IsString() @MaxLength(255) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(20)  postal_code?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
}
 
// ── CREATE ──────────────────────────────────────────────────────
export class CreateSupplierDto {
 
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
 
  @IsOptional() @IsString() @MaxLength(50)
  matricule_fiscal?: string;
 
  @IsOptional() @IsEmail()
  email?: string;
 
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;
 
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
 
  @IsOptional() @IsString() @MaxLength(50)
  rib?: string;
 
  @IsOptional() @IsString() @MaxLength(100)
  bank_name?: string;
 
  @IsOptional() @IsInt() @Min(0) @Max(365)
  payment_terms?: number;
 
  @IsOptional() @IsString() @MaxLength(100)
  category?: string;
 
  @IsOptional() @IsString()
  notes?: string;
}
export class QuerySuppliersDto {
 
  @IsOptional()
  @IsString()
  search?: string;
 
  @IsOptional()
  @IsString()
  category?: string;
 
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
 
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;
 
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}