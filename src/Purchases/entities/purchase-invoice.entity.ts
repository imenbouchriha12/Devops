import { SupplierPO } from 'src/supplier-po/entities/supplier-po.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';


@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column()
  invoice_number_supplier: string;

  @ManyToOne(() => Supplier)
  supplier: Supplier;

  @ManyToOne(() => SupplierPO, { nullable: true })
  supplier_po: SupplierPO;

  @Column({ type: 'date' })
  invoice_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal_ht: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1000 })
  timbre_fiscal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  net_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ nullable: true })
  receipt_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => PurchaseInvoiceItem, (item) => item.purchase_invoice, { cascade: true })
  items: PurchaseInvoiceItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}