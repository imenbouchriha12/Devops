import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { GoodsReceipt } from './goods-receipt.entity';
import { SupplierPOItem } from 'src/supplier-po/entities/supplier-po-item.entity';



@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GoodsReceipt, (gr) => gr.items)
  goods_receipt: GoodsReceipt;

  @ManyToOne(() => SupplierPOItem)
  supplier_po_item: SupplierPOItem;

 /* @ManyToOne(() => Product)
  product: Product;*/

  @Column('int')
  quantity_received: number;
}