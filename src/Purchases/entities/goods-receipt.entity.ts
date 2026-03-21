import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business }       from '../../businesses/entities/business.entity';
import { User }           from '../../users/entities/user.entity';
import { SupplierPO }     from './supplier-po.entity';
import { GoodsReceiptItem } from './goods-receipt-item.entity';

@Entity('goods_receipts')
@Index(['business_id'])
@Index(['supplier_po_id'])
@Index(['received_by'])
export class GoodsReceipt {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Numéro auto-généré : BR-2024-0001
  @Column({ type: 'varchar', length: 50, unique: true })
  gr_number: string;

  // ── Multitenant ───────────────────────────────────────────────
  @Column({ type: 'uuid' })
  business_id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // ── Bon de commande source ────────────────────────────────────
  @Column({ type: 'uuid' })
  supplier_po_id: string;

  // eager:true = BC chargé auto (contient le fournisseur)
  @ManyToOne(() => SupplierPO, (po) => po.goods_receipts, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'supplier_po_id' })
  supplier_po: SupplierPO;

  // ── Réception ─────────────────────────────────────────────────
  @Column({ type: 'date' })
  receipt_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ── Utilisateur qui a validé la réception ─────────────────────
  // Lien vers User (même module Auth) — eager:false pour performance
  @Column({ type: 'uuid' })
  received_by: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'received_by' })
  receiver: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // ── Lignes de réception ───────────────────────────────────────
  @OneToMany(() => GoodsReceiptItem, (item) => item.goods_receipt, {
    cascade: true,
  })
  items: GoodsReceiptItem[];
}