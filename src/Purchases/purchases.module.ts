import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { SupplierPOItem } from './entities/supplier-po-item.entity';
import { SupplierPO } from './entities/supplier-po.entity';
import { Supplier } from './entities/supplier.entity';

@Module({
    imports: [
      TypeOrmModule.forFeature([
        GoodsReceipt,
        GoodsReceiptItem,
        PurchaseInvoiceItem,
        PurchaseInvoice,
        StockMovement,
        SupplierPayment,
        SupplierPOItem,
        SupplierPO,
        Supplier

      ]),
    ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
