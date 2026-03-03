// src/accounts/entities/account.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountType } from '../enums/account-type.enum';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  business_id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: AccountType })
  type!: AccountType;

  @Column({ nullable: true })
  bank_name?: string;

  @Column({ nullable: true, length: 23 })
  rib?: string;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  opening_balance!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  current_balance!: number;

  @Column({ default: 'TND' })
  currency!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: false })
  is_default!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
