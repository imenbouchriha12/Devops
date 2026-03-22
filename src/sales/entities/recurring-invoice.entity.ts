import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export enum RecurringFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

@Entity('recurring_invoices')
@Index(['business_id', 'is_active'])
@Index(['next_generation'])
export class RecurringInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid' })
  invoice_id: string;

  @ManyToOne(() => Invoice, { eager: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({
    type: 'enum',
    enum: RecurringFrequency
  })
  frequency: RecurringFrequency;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ type: 'date', nullable: true })
  last_generated: Date | null;

  @Column({ type: 'date' })
  next_generation: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
