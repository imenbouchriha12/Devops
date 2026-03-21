import { IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

// ── Ligne du bon de commande ─────────────────────────────────────
export class CreateSupplierPOItemDto {

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description: string;

  @IsNumber()
  @IsPositive()
  quantity_ordered: number;

  @IsNumber()
  @Min(0)
  unit_price_ht: number;

  // Taux TVA : 0, 7, 13 ou 19 (Tunisie)
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate_value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
