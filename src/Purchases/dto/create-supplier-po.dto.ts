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
import { CreateSupplierPOItemDto } from './create-supplier-po-item.dto';
 
 
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
  @ArrayMinSize(1, { message: 'Le bon de commande doit avoir au moins une ligne.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPOItemDto)
  items: CreateSupplierPOItemDto[];
}