// src/sales/entities/stock-exit-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockExit } from './stock-exit.entity';

@Entity('stock_exit_items')
export class StockExitItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stock_exit_id: string;

  @ManyToOne(() => StockExit, (exit) => exit.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_exit_id' })
  stock_exit: StockExit;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;
}
