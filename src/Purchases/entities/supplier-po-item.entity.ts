import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SupplierPO } from './supplier-po.entity';
import { Product } from '../../stock/entities/product.entity';

@Entity('supplier_po_items')
@Index(['supplier_po_id'])
@Index(['product_id'])
export class SupplierPOItem {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  supplier_po_id: string;

  // Référence au produit du catalogue du Module 4 (Stocks)
  // nullable : un produit peut être commandé sans être dans le catalogue
  @Column({ type: 'uuid', nullable: true })
  product_id: string | null;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity_ordered: number;

  // Mis à jour à chaque bon de réception (GoodsReceipt)
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantity_received: number;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  unit_price_ht: number;

  // Snapshot du taux TVA au moment de la création
  // Valeurs possibles en Tunisie : 0, 7, 13, 19
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tax_rate_value: number;

  // Champs calculés et stockés pour éviter de recalculer
  // line_total_ht = quantity_ordered × unit_price_ht
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  line_total_ht: number;

  // line_tax = line_total_ht × (tax_rate_value / 100)
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  line_tax: number;

  // Ordre d'affichage des lignes dans le document
  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  // ── Relations ─────────────────────────────────────────────────
  // onDelete CASCADE : si le BC est supprimé, ses lignes le sont aussi
  @ManyToOne(() => SupplierPO, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_po_id' })
  supplier_po: SupplierPO;

  @ManyToOne(() => Product, (product) => product.supplierPOItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}