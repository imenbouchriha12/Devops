import { IsNumber, IsPositive, IsUUID } from "class-validator";

// ── Ligne de réception ───────────────────────────────────────────
export class CreateGoodsReceiptItemDto {

  // ID de la ligne du BC (SupplierPOItem)
  @IsUUID()
  supplier_po_item_id: string;

  // Doit être > 0 et <= reliquat (quantity_ordered - quantity_received)
  @IsNumber()
  @IsPositive()
  quantity_received: number;
}