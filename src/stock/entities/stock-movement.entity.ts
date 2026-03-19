import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockMovementType } from '../enums/stock-movement-type.enum';
import { Product } from './product.entity';

@Entity('stock_movements')
@Index(['productId', 'createdAt'])
@Index(['business_id', 'type'])
@Index(['reference_type', 'reference_id'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant isolation
  @Column({ type: 'uuid' })
  @Index()
  business_id: string;

  @Column('uuid')
  productId: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
  })
  type: StockMovementType;

  // Quantity (positive for IN, negative for OUT)
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  // Stock quantity before this movement
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantity_before: number;

  // Stock quantity after this movement
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantity_after: number;

  // Unit cost at the time of movement (for valuation)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unit_cost: number | null;

  // Total value of this movement
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_value: number | null;

  // Reference to source document (polymorphic relation)
  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_type: string | null; // 'goods_receipt', 'sales_order', 'stock_exit', 'adjustment', etc.

  @Column({ type: 'uuid', nullable: true })
  reference_id: string | null; // ID of the source document

  // Human-readable reference number
  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string | null;

  // User who created this movement
  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  // Location/warehouse (for multi-location inventory)
  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // ── Relations ────────────────────────────────────────────────
  
  @ManyToOne(() => Product, (product) => product.stockMovements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
