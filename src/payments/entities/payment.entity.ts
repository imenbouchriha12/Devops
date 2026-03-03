// src/payments/entities/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  business_id!: string;

  @Column({ type: 'uuid' })
  invoice_id!: string;

  @Column({ type: 'uuid' })
  account_id!: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount!: number;

  @Column({ type: 'date' })
  payment_date!: Date;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;
}
