// src/transactions/entities/transaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TransactionType } from '../enums/transaction-type.enum';


@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  business_id!: string;

  @Column({ type: 'uuid' })
  account_id!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount!: number;

  @Column({ type: 'date' })
  transaction_date!: Date;

  @Column()
  description!: string;

  @Column({ nullable: true })
  source_type?: string;   // "Payment" | "SupplierPayment" | "Manual"

  @Column({ type: 'uuid', nullable: true })
  source_id?: string;

  @Column({ default: false })
  is_reconciled!: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  balance_after!: number;

  @CreateDateColumn()
  created_at!: Date;
}
