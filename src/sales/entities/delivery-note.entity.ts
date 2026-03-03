// src/sales/entities/delivery-note.entity.ts
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
import { SalesOrder } from './sales-order.entity';
import { DeliveryNoteItem } from './delivery-note-item.entity';

export enum DeliveryNoteStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}

@Entity('delivery_notes')
export class DeliveryNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ unique: true })
  delivery_number: string;

  @Column({ type: 'uuid' })
  sales_order_id: string;

  @ManyToOne(() => SalesOrder, (order) => order.delivery_notes)
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column({ type: 'date' })
  delivery_date: Date;

  @Column({
    type: 'enum',
    enum: DeliveryNoteStatus,
    default: DeliveryNoteStatus.DRAFT,
  })
  status: DeliveryNoteStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => DeliveryNoteItem, (item) => item.delivery_note, { cascade: true })
  items: DeliveryNoteItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
