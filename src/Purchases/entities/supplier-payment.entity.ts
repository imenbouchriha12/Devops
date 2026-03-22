// src/Purchases/entities/supplier-payment.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Supplier }         from './supplier.entity';
import { PurchaseInvoice }  from './purchase-invoice.entity';

export enum PaymentMethod {
  VIREMENT   = 'VIREMENT',
  CHEQUE     = 'CHEQUE',
  ESPECES    = 'ESPECES',
  TRAITE     = 'TRAITE',
  CARTE      = 'CARTE',
}

@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column()
  supplier_id: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  purchase_invoice_id: string;

  @ManyToOne(() => PurchaseInvoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchase_invoice: PurchaseInvoice;

  // ✅ Added account relation
  @Column({ nullable: true })
  account_id: string;

  @ManyToOne('Account', 'supplierPayments', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'account_id' })
  account: any;

  @Column({ unique: true })
  payment_number: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.VIREMENT })
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}