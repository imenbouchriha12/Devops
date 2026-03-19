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
 
// ── Sous-DTO pour l'adresse ─────────────────────────────────────
class AddressDto {
  @IsOptional() @IsString() @MaxLength(255) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(20)  postal_code?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
}
 
// ── Create ──────────────────────────────────────────────────────
export class CreateSupplierDto {
 
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
 
  @IsOptional()
  @IsString()
  @MaxLength(50)
  matricule_fiscal?: string;
 
  @IsOptional()
  @IsEmail()
  email?: string;
 
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
 
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
 
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rib?: string;
 
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bank_name?: string;
 
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  payment_terms?: number;
 
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
 
  @IsOptional()
  @IsString()
  notes?: string;
}