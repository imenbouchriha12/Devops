// ── Update ──────────────────────────────────────────────────────
// Seulement possible si status = PENDING

import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseInvoiceDto } from "./create-purchase-invoice.dto";

// OmitType supprime supplier_id : on ne peut pas changer le fournisseur d'une facture
export class UpdatePurchaseInvoiceDto extends PartialType(
  OmitType(CreatePurchaseInvoiceDto, ['supplier_id', 'supplier_po_id'] as const)
) {}
 