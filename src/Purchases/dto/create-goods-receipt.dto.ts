import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGoodsReceiptItemDto } from './create-goods-receipt-item.dto';
 
export class CreateGoodsReceiptDto {
 
  // Si non fourni, la date du jour sera utilisée
  @IsOptional()
  @IsDateString()
  receipt_date?: string;
 
  @IsOptional()
  @IsString()
  notes?: string;
 
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une ligne de réception est requise.' })
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}