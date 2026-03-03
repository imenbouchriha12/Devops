import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';

@Entity('purchase_invoice_items')
export class PurchaseInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseInvoice, (invoice) => invoice.items)
  purchase_invoice: PurchaseInvoice;

  /*@ManyToOne(() => Product)
  product: Product;*/

  @Column({ nullable: true })
  description: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price_ht: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total_ht: number;
}