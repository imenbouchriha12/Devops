import { Type } from "class-transformer";
import { CreateSupplierPOItemDto } from "./create-supplier-po-item.dto";
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

// ── Création BC ──────────────────────────────────────────────────
export class CreateSupplierPODto {

  @IsUUID()
  supplier_id: string;

  @IsOptional()
  @IsDateString()
  expected_delivery?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Le BC doit avoir au moins une ligne.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPOItemDto)
  items: CreateSupplierPOItemDto[];
}
