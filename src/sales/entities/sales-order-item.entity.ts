import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../stock/entities/product.entity';

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('SalesOrder', 'items', { onDelete: 'CASCADE' })
  salesOrder: any;

  @Column()
  salesOrderId: string;

  @ManyToOne(() => Product, (product) => product.salesOrderItems, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // ═══════════════════════════════════════════════════════════════
  // Added by Alaa for stock module - New product relation
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'stock_product_id' })
  stock_product: Product | null;

  @Column({ type: 'uuid', nullable: true })
  stock_product_id: string | null;
  // ═══════════════════════════════════════════════════════════════

  @Column({ nullable: true })
  productId: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
}
