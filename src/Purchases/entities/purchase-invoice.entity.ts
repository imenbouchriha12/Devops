import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Supplier }    from './supplier.entity';
import { SupplierPO }  from './supplier-po.entity';
import { InvoiceStatus } from '../enum/invoice-status.enum';



@Entity('purchase_invoices')
@Index(['business_id', 'status'])
@Index(['business_id', 'supplier_id'])
@Index(['business_id', 'due_date'])
export class PurchaseInvoice {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Numéro imprimé sur la facture PAPIER reçue du fournisseur
  // Ce n'est PAS un numéro généré par nous
  @Column({ type: 'varchar', length: 100 })
  invoice_number_supplier: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @Column({ type: 'uuid' })
  @Index()
  business_id: string;

  @Column({ type: 'uuid' })
  supplier_id: string;

  // Lien optionnel vers le BC d'origine
  @Column({ type: 'uuid', nullable: true })
  supplier_po_id: string | null;

  // Date figurant sur la facture reçue
  @Column({ type: 'date' })
  invoice_date: Date;

  // Calculée : invoice_date + supplier.payment_terms jours
  @Column({ type: 'date' })
  due_date: Date;

  // ── Montants saisis depuis la facture papier reçue ───────────
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  subtotal_ht: number;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 1.000 })
  timbre_fiscal: number;

  // NET À PAYER = subtotal_ht + tax_amount + timbre_fiscal
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  net_amount: number;

  // Mis à jour par le Module 5 (Trésorerie) à chaque SupplierPayment
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  paid_amount: number;

  // URL du scan ou photo de la facture papier
  @Column({ type: 'varchar', length: 500, nullable: true })
  receipt_url: string | null;

  // Rempli si status = DISPUTED
  @Column({ type: 'text', nullable: true })
  dispute_reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // ── Relations ────────────────────────────────────────────────
  // eager:true = le fournisseur chargé automatiquement
  @ManyToOne(() => Supplier, (s) => s.purchase_invoices, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  // eager:false = chargé uniquement quand on demande la relation explicitement
  @ManyToOne(() => SupplierPO, { nullable: true, eager: false })
  @JoinColumn({ name: 'supplier_po_id' })
  supplier_po: SupplierPO | null;

  // ── Propriétés calculées (non stockées en DB) ────────────────
  get remaining_amount(): number {
    return Math.round((Number(this.net_amount) - Number(this.paid_amount)) * 1000) / 1000;
  }
}