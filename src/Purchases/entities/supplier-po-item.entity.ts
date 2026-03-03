import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SupplierPO } from './supplier-po.entity';

@Entity('supplier_po_items')
export class SupplierPOItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SupplierPO, (po) => po.items)
  supplier_po: SupplierPO;

 /* @ManyToOne(() => Product)
  product: Product;*/

  @Column({ nullable: true })
  description: string;

  @Column('int')
  quantity_ordered: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price_ht: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate_value: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total_ht: number;

  @Column({ type: 'int', default: 0 })
  quantity_received: number;
}