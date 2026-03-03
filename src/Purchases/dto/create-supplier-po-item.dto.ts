
import { IsUUID, IsOptional, IsInt, IsDecimal, IsString } from 'class-validator';

export class CreateSupplierPOItemDto {
  @IsUUID()
  supplier_po_id: string;

  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  quantity_ordered: number;

  @IsDecimal()
  unit_price_ht: number;

  @IsOptional()
  @IsDecimal()
  tax_rate_value?: number;

  @IsDecimal()
  line_total_ht: number;

  @IsOptional()
  @IsInt()
  quantity_received?: number;
}