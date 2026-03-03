import { IsUUID, IsInt, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStockMovementDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsUUID()
  supplier_po_id?: string;

  @IsOptional()
  @IsUUID()
  goods_receipt_id?: string;

  @IsEnum(['ENTREE', 'SORTIE'])
  type: 'ENTREE' | 'SORTIE';

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}