
import { IsUUID, IsDateString, IsOptional, IsDecimal, IsString } from 'class-validator';

export class UpdateSupplierPODto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  supplier_id: string;

  @IsOptional()
  @IsDateString()
  expected_delivery?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDecimal()
  subtotal_ht?: number;

  @IsOptional()
  @IsDecimal()
  tax_amount?: number;

  @IsOptional()
  @IsDecimal()
  net_amount?: number;
}