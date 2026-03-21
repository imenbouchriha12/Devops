import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';

// ── Création facture (saisie manuelle depuis la facture papier) ──
export class CreatePurchaseInvoiceDto {

  // N° imprimé sur la facture papier du fournisseur
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  invoice_number_supplier: string;

  @IsUUID()
  supplier_id: string;

  // Lien optionnel vers le BC d'origine
  @IsOptional()
  @IsUUID()
  supplier_po_id?: string;

  @IsDateString()
  invoice_date: string;

  // Si non fourni : calculée auto = invoice_date + supplier.payment_terms jours
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsNumber()
  @Min(0)
  subtotal_ht: number;

  @IsNumber()
  @Min(0)
  tax_amount: number;

  // Si non fourni : 1,000 DT par défaut (timbre fiscal tunisien)
  @IsOptional()
  @IsNumber()
  @Min(0)
  timbre_fiscal?: number;

  // Si fourni, le serveur vérifie la cohérence avec les montants
  @IsOptional()
  @IsNumber()
  @Min(0)
  net_amount?: number;

  // URL du scan / photo de la facture papier
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receipt_url?: string;
}

