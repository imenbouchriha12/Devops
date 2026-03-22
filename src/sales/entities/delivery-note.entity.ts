import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Client } from '../../clients/entities/client.entity';
import { DeliveryNoteItem } from './delivery-note-item.entity';

@Entity('delivery_notes')
@Index(['businessId', 'status'])
@Index(['businessId', 'clientId'])
@Index(['salesOrderId'])
export class DeliveryNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deliveryNoteNumber: string;

  @Column({ type: 'date' })
  deliveryDate: Date;

  @Column({
    type: 'enum',
    enum: DeliveryNoteStatus,
    default: DeliveryNoteStatus.DRAFT
  })
  status: DeliveryNoteStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deliveredBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @ManyToOne('SalesOrder', 'deliveryNotes', { nullable: true })
  salesOrder: any;

  @Column({ nullable: true })
  salesOrderId: string;

  @OneToMany(() => DeliveryNoteItem, item => item.deliveryNote, { cascade: true })
  items: DeliveryNoteItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}