import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
 
// ── Sous-DTO pour une ligne du bon de commande ──────────────────
export class CreateSupplierPOItemDto {
 
  // Produit du catalogue Module 4 — optionnel si hors catalogue
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
 
  // Taux TVA tunisien : 0, 7, 13 ou 19
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate_value: number;
 
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
