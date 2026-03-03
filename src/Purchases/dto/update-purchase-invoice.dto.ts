
import { IsUUID, IsDateString, IsOptional, IsDecimal, IsString } from 'class-validator';

export class UpdatePurchaseInvoiceDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  supplier_id: string;

  @IsOptional()
  @IsUUID()
  supplier_po_id?: string;

  @IsString()
  invoice_number_supplier: string;

  @IsDateString()
  invoice_date: Date;

  @IsDateString()
  due_date: Date;

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

  @IsOptional()
  @IsDecimal()
  paid_amount?: number;

  @IsOptional()
  @IsString()
  receipt_url?: string;
}