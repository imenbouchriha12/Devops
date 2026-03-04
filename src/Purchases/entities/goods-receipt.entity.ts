
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { SupplierPO } from './supplier-po.entity';
import { GoodsReceiptItem } from './goods-receipt-item.entity';


@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column({ unique: true })
  gr_number: string;

  @ManyToOne(() => SupplierPO, (po) => po.goods_receipts)
  supplier_po: SupplierPO;

  @Column({ type: 'date' })
  receipt_date: Date;

  @ManyToOne(() => User)
  received_by: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => GoodsReceiptItem, (item) => item.goods_receipt, { cascade: true })
  items: GoodsReceiptItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}