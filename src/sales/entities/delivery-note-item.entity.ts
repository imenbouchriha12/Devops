// src/sales/entities/delivery-note-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeliveryNote } from './delivery-note.entity';
import { SalesOrderItem } from './sales-order-item.entity';

@Entity('delivery_note_items')
export class DeliveryNoteItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  delivery_note_id: string;

  @ManyToOne(() => DeliveryNote, (note) => note.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_note_id' })
  delivery_note: DeliveryNote;

  @Column({ type: 'uuid' })
  sales_order_item_id: string;

  @ManyToOne(() => SalesOrderItem)
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item: SalesOrderItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity_delivered: number;
}
