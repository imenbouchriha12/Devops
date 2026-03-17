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

export class CreatePurchaseInvoiceDto {

  // Numéro imprimé sur la facture papier (celui du fournisseur, pas le nôtre)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  invoice_number_supplier: string;

  @IsUUID()
  supplier_id: string;

  // Lien optionnel vers le bon de commande d'origine
  @IsOptional()
  @IsUUID()
  supplier_po_id?: string;

  @IsDateString()
  invoice_date: string;

  // Si non fourni : calculée automatiquement = invoice_date + supplier.payment_terms jours
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsNumber()
  @Min(0)
  subtotal_ht: number;

  @IsNumber()
  @Min(0)
  tax_amount: number;

  // Si non fourni : 1.000 DT par défaut (obligatoire en Tunisie)
  @IsOptional()
  @IsNumber()
  @Min(0)
  timbre_fiscal?: number;

  // Si fourni, le serveur vérifie la cohérence avec subtotal_ht + tax_amount + timbre
  @IsOptional()
  @IsNumber()
  @Min(0)
  net_amount?: number;

  // URL du scan ou photo de la facture papier uploadée
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receipt_url?: string;
}

