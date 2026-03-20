import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SupplierPO }      from './supplier-po.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';
 
@Entity('suppliers')
@Index(['business_id', 'is_active'])
@Index(['business_id', 'name'])
export class Supplier {
 
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  // Isolation multitenant : chaque business ne voit que ses fournisseurs
  @Column({ type: 'uuid' })
  @Index()
  business_id: string;
 
  @Column({ type: 'varchar', length: 255 })
  name: string;
 
  // Matricule Fiscal — obligatoire légalement sur les factures reçues en Tunisie
  @Column({ type: 'varchar', length: 50, nullable: true })
  matricule_fiscal: string | null;
 
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;
 
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;
 
  // JSONB : stocke l'adresse comme objet JSON directement en DB
  @Column({ type: 'jsonb', nullable: true })
  address: {
    street?:      string;
    city?:        string;
    postal_code?: string;
    country?:     string;
  } | null;
 
  // Coordonnées bancaires pour les paiements par virement
  @Column({ type: 'varchar', length: 50, nullable: true })
  rib: string | null;
 
  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;
 
  // Délai de paiement en jours : utilisé pour calculer la due_date des factures
  @Column({ type: 'integer', default: 30 })
  payment_terms: number;
 
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;
 
  // Soft delete : false = archivé, true = actif
  @Column({ type: 'boolean', default: true })
  is_active: boolean;
 
  @Column({ type: 'text', nullable: true })
  notes: string | null;
 
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
 
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
 
  // ── Relations ────────────────────────────────────────────────
  @OneToMany(() => SupplierPO, (po) => po.supplier)
  supplier_pos: SupplierPO[];
 
  @OneToMany(() => PurchaseInvoice, (inv) => inv.supplier)
  purchase_invoices: PurchaseInvoice[];

  @OneToMany('GoodsReceipt', 'supplier')
  goods_receipts: any[];
}