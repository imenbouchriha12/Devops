// src/sales/entities/stock-exit.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { DeliveryNote } from './delivery-note.entity';
import { SalesOrder } from './sales-order.entity';
import { StockExitItem } from './stock-exit-item.entity';

export enum StockExitStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}

@Entity('stock_exits')
export class StockExit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ unique: true })
  exit_number: string;

  @Column({ type: 'uuid', nullable: true })
  delivery_note_id: string;

  @ManyToOne(() => DeliveryNote, { nullable: true })
  @JoinColumn({ name: 'delivery_note_id' })
  delivery_note: DeliveryNote;

  @Column({ type: 'uuid', nullable: true })
  sales_order_id: string;

  @ManyToOne(() => SalesOrder, { nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column({ type: 'date' })
  exit_date: Date;

  @Column({
    type: 'enum',
    enum: StockExitStatus,
    default: StockExitStatus.DRAFT,
  })
  status: StockExitStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => StockExitItem, (item) => item.stock_exit, { cascade: true })
  items: StockExitItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
