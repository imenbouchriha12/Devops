import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('products')
@Index(['business_id', 'isActive'])
@Index(['business_id', 'sku'])
@Index(['category_id'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant isolation: each business has its own products
  @Column({ type: 'uuid' })
  @Index()
  business_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Selling price (HT - excluding tax)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  // Purchase cost (used for stock valuation)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number | null;

  // Current stock quantity (updated by stock movements)
  @Column({ type: 'int', default: 0 })
  quantity: number;

  // Minimum quantity threshold for reorder alerts
  @Column({ type: 'int', default: 0 })
  minQuantity: number;

  // Product category
  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  // Default supplier for this product
  @Column({ type: 'uuid', nullable: true })
  default_supplier_id: string | null;

  // Unit of measure (e.g., 'pcs', 'kg', 'L', 'm')
  @Column({ type: 'varchar', length: 20, default: 'pcs' })
  unit: string;

  // Barcode for scanning
  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  // Product weight (for shipping calculations)
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number | null;

  // Product dimensions (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string; // 'cm', 'm', 'in'
  } | null;

  // Tax rate applicable to this product
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19 })
  tax_rate: number;

  // Track inventory for this product
  @Column({ type: 'boolean', default: true })
  track_inventory: boolean;

  // Product type: 'product', 'service', 'bundle'
  @Column({ type: 'varchar', length: 20, default: 'product' })
  type: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Relations ────────────────────────────────────────────────
  
  // Category relation
  @ManyToOne(() => ProductCategory, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  // Stock movements history
  @OneToMany(() => StockMovement, (movement) => movement.product)
  stockMovements: StockMovement[];

  // Relations with other modules (lazy loaded to avoid circular dependencies)
  
  // Sales module relations
  @OneToMany('SalesOrderItem', 'product')
  salesOrderItems: any[];

  @OneToMany('QuoteItem', 'product')
  quoteItems: any[];

  @OneToMany('DeliveryNoteItem', 'product')
  deliveryNoteItems: any[];

  @OneToMany('StockExitItem', 'product')
  stockExitItems: any[];

  // Purchase module relations
  @OneToMany('SupplierPOItem', 'product')
  supplierPOItems: any[];

  @OneToMany('GoodsReceiptItem', 'product')
  goodsReceiptItems: any[];
}
