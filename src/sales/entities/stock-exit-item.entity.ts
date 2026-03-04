import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from '../../stock/entities/product.entity';

@Entity('stock_exit_items')
export class StockExitItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('StockExit', 'items', { onDelete: 'CASCADE' })
  stockExit: any;

  @Column()
  stockExitId: string;

  @ManyToOne(() => Product, { nullable: false })
  product: Product;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;
}
