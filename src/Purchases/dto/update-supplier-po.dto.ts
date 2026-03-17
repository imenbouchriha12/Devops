import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { CreateSupplierPOItemDto } from "./create-supplier-po-item.dto";

export class UpdateSupplierPODto {
 
  @IsOptional()
  @IsDateString()
  expected_delivery?: string;
 
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
 
  // Si fourni, remplace TOUTES les lignes existantes
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPOItemDto)
  items?: CreateSupplierPOItemDto[];
}