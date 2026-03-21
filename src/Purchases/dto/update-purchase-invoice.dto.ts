// ── Modification (PENDING seulement) ─────────────────────────────

import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseInvoiceDto } from "./create-purchase-invoice.dto";
import { IsNumber, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

// OmitType retire supplier_id : on ne peut pas changer le fournisseur
export class UpdatePurchaseInvoiceDto extends PartialType(
  OmitType(CreatePurchaseInvoiceDto, ['supplier_id', 'supplier_po_id'] as const),
) {}

// ── Mise en litige ────────────────────────────────────────────────
export class DisputePurchaseInvoiceDto {

  @IsString()
  @MinLength(10, { message: 'La raison du litige doit faire au moins 10 caractères.' })
  @MaxLength(1000)
  dispute_reason: string;
}

// ── Mise à jour paiement (appelé par Module 5) ────────────────────
export class UpdatePaymentAmountDto {

  // Montant TOTAL payé (pas un delta)
  // Ex : 200 DT déjà payés + 100 DT nouveaux → envoyer 300
  @IsNumber()
  @IsPositive()
  paid_amount: number;
}