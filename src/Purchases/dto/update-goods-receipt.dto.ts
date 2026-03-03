import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateGoodsReceiptDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  supplier_po_id: string;

  @IsDateString()
  receipt_date: Date;

  @IsUUID()
  received_by: string;

  @IsOptional()
  @IsString()
  notes?: string;
}