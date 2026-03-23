import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseInvoice } from '../../Purchases/entities/purchase-invoice.entity';
import { Account } from '../../accounts/entities/account.entity';
import { Business } from '../../businesses/entities/business.entity';
import { PaymentMethod }from '../../payments/enums/payment-method.enum';

@Entity('supplier_payments')
@Index(['business_id', 'payment_date'])
@Index(['purchase_invoice_id'])
@Index(['account_id'])
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ type: 'uuid' })
  purchase_invoice_id: string;

  @ManyToOne(() => PurchaseInvoice, { eager: true })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchaseInvoice: PurchaseInvoice;

  @Column({ type: 'uuid' })
  account_id: string;

  @ManyToOne(() => Account, (account) => account.supplierPayments)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
