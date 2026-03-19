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
 
export class CreateGoodsReceiptItemDto {
 
  // ID de la ligne du BC correspondante (SupplierPOItem)
  @IsUUID()
  supplier_po_item_id: string;
 
  // Doit être > 0 et <= reliquat restant (quantity_ordered - quantity_received)
  @IsNumber()
  @IsPositive()
  quantity_received: number;
}
 