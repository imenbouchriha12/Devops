
import { GoodsReceipt } from 'src/goods-receipt/entities/goods-receipt.entity';
import { SupplierPO } from 'src/supplier-po/entities/supplier-po.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  /*@ManyToOne(() => Product)
  product: Product;*/

  @ManyToOne(() => SupplierPO, { nullable: true })
  supplier_po: SupplierPO;

  @ManyToOne(() => GoodsReceipt, { nullable: true })
  goods_receipt: GoodsReceipt;

  @Column({ type: 'enum', enum: ['ENTREE', 'SORTIE'] })
  type: 'ENTREE' | 'SORTIE';

  @Column('int')
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}