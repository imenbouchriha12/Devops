
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionType } from '../enums/transaction-type.enum';
import { Account } from '../../accounts/entities/account.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('transactions')
@Index(['business_id', 'transaction_date'])
@Index(['account_id', 'transaction_date'])
@Index(['is_reconciled'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  business_id!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'uuid' })
  account_id!: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount!: number;

  @Column({ type: 'date' })
  transaction_date!: Date;

  @Column({ nullable: true })
  description?: string;

  // polymorphic relation (good idea from Kiro)
  @Column({ nullable: true })
  source_type?: string;

  @Column({ type: 'uuid', nullable: true })
  source_id?: string;

  @Column({ default: false })
  is_reconciled!: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  balance_after!: number;

  @CreateDateColumn()
  created_at!: Date;
}
