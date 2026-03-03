import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SupplierPOItem } from './supplier-po-item.entity';
import { GoodsReceipt } from 'src/goods-receipt/entities/goods-receipt.entity';
import { PurchaseInvoice } from 'src/purchase-invoice/entities/purchase-invoice.entity';
import { POStatus } from '../enums/po-status.enum';


@Entity('supplier_pos')
export class SupplierPO {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column({ unique: true })
  po_number: string;

 /* @ManyToOne(() => Supplier, (supplier) => supplier.purchase_orders)
  supplier: Supplier;*/

  @Column({ type: 'date', nullable: true })
  expected_delivery: Date;

  @Column({ type: 'enum', enum: POStatus, default: POStatus.DRAFT })
  status: POStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal_ht: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1000 })
  timbre_fiscal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  net_amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => SupplierPOItem, (item) => item.supplier_po, { cascade: true })
  items: SupplierPOItem[];

  @OneToMany(() => GoodsReceipt, (gr) => gr.supplier_po)
  goods_receipts: GoodsReceipt[];

  @OneToMany(() => PurchaseInvoice, (invoice) => invoice.supplier_po)
  purchase_invoices: PurchaseInvoice[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}