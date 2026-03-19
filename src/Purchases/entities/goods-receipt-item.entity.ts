import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { GoodsReceipt }  from './goods-receipt.entity';
import { SupplierPOItem } from './supplier-po-item.entity';
import { Product } from '../../stock/entities/product.entity';

@Entity('goods_receipt_items')
@Index(['gr_id'])
@Index(['supplier_po_item_id'])
@Index(['product_id'])
export class GoodsReceiptItem {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  gr_id: string;

  // Lien vers la ligne du BC correspondante
  @Column({ type: 'uuid' })
  supplier_po_item_id: string;

  // Copié depuis SupplierPOItem pour éviter un JOIN lors de l'appel au Module 4
  @Column({ type: 'uuid', nullable: true })
  product_id: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity_received: number;

  // Snapshot du prix au moment de la réception
  // Utilisé par le Module 4 pour valoriser le stock entrant
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  unit_price_ht: number;

  // ── Relations ────────────────────────────────────────────────
  @ManyToOne(() => GoodsReceipt, (gr) => gr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gr_id' })
  goods_receipt: GoodsReceipt;

  @ManyToOne(() => SupplierPOItem)
  @JoinColumn({ name: 'supplier_po_item_id' })
  supplier_po_item: SupplierPOItem;

  @ManyToOne(() => Product, (product) => product.goodsReceiptItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}