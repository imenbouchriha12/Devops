import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';

import { Category }         from './product-category.entity';
import { StockMovement }    from './stock-movement.entity';
import { SupplierPOItem }   from '../../Purchases/entities/supplier-po-item.entity';
import { GoodsReceiptItem } from '../../Purchases/entities/goods-receipt-item.entity';
import { Business }         from '../../businesses/entities/business.entity';

/**
 * 🔥 Transformer: converts DECIMAL <-> number
 */
const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null): number => value ? parseFloat(value) : 0,
};

@Entity('products')
@Index(['business_id', 'is_active'])
@Index(['business_id', 'reference'])
@Index(['category_id'])
export class Product {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  business_id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // -----------------------------
  // 🏷️ BASIC INFO
  // -----------------------------

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  reference: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // -----------------------------
  // 🗂️ CATEGORY
  // -----------------------------

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  // -----------------------------
  // 📦 UNIT & PRICING
  // -----------------------------

  @Column({ type: 'varchar', length: 50, default: 'pièce' })
  unit: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  sale_price_ht: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  purchase_price_ht: number;

  @Column({ type: 'uuid', nullable: true })
  tax_rate_id: string | null;

  // -----------------------------
  // 📊 STOCK (CORE)
  // -----------------------------

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  current_stock: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  min_stock_threshold: number;

  @Column({ type: 'boolean', default: true })
  is_stockable: boolean;

  // -----------------------------
  // 🔎 EXTRA
  // -----------------------------

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // -----------------------------
  // 🕒 TIMESTAMPS
  // -----------------------------

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // -----------------------------
  // 🔗 RELATIONS
  // -----------------------------

  @OneToMany(() => StockMovement, (movement) => movement.product)
  stock_movements: StockMovement[];

  // Sales module relations (lazy string refs)
  @OneToMany('SalesOrderItem', 'product')
  salesOrderItems: any[];

  @OneToMany('QuoteItem', 'product')
  quoteItems: any[];

  @OneToMany('DeliveryNoteItem', 'product')
  deliveryNoteItems: any[];

  @OneToMany('StockExitItem', 'product')
  stockExitItems: any[];

  // Purchases module relations
  @OneToMany(() => SupplierPOItem, (item) => item.product)
  supplierPOItems: SupplierPOItem[];

  @OneToMany(() => GoodsReceiptItem, (item) => item.product)
  goodsReceiptItems: GoodsReceiptItem[];
}