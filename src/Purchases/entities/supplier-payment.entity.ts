
import { PurchaseInvoice } from 'src/purchase-invoice/entities/purchase-invoice.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { PaymentMethod } from '../enums/payment-method.enum';


@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @ManyToOne(() => PurchaseInvoice)
  purchase_invoice: PurchaseInvoice;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.BANK_TRANSFER })
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}