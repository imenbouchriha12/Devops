
import { IsUUID, IsOptional, IsInt, IsDecimal, IsString } from 'class-validator';

export class CreatePurchaseInvoiceItemDto {
  @IsUUID()
  purchase_invoice_id: string;

  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  quantity: number;

  @IsDecimal()
  unit_price_ht: number;

  @IsOptional()
  @IsDecimal()
  tax_rate?: number;

  @IsDecimal()
  line_total_ht: number;
}