
import { IsUUID, IsInt } from 'class-validator';

export class UpdateGoodsReceiptItemDto {
  @IsUUID()
  goods_receipt_id: string;

  @IsUUID()
  supplier_po_item_id: string;

  @IsUUID()
  product_id: string;

  @IsInt()
  quantity_received: number;
}