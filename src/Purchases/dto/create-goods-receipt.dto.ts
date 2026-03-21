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



// ── Création bon de réception ────────────────────────────────────
// Pas d'UpdateGoodsReceiptDto — un BR est immuable une fois créé
export class CreateGoodsReceiptDto {

  // Si non fourni → date du jour
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