import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { SupplierPOItem } from './entities/supplier-po-item.entity';
import { SupplierPO } from './entities/supplier-po.entity';
import { Supplier } from './entities/supplier.entity';
import { SuppliersService } from './services/suppliers.service';
import { SuppliersController } from './controllers/suppliers.controller';
import { SupplierPOsController } from './controllers/supplier-pos.controller';
import { SupplierPOsService } from './services/supplier-pos.service';
import { GoodsReceiptsService } from './services/goods-receipts.service';
import { PurchaseInvoicesService } from './services/purchase-invoices.service';
import { GoodsReceiptsController } from './controllers/goods-receipts.controller';
import { PurchaseInvoicesController } from './controllers/purchase-invoices.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
      TypeOrmModule.forFeature([
        GoodsReceipt,
        GoodsReceiptItem,
        PurchaseInvoice,
        SupplierPOItem,
        SupplierPO,
        Supplier

      ]),
        HttpModule,   

    ],
  controllers: [PurchasesController, SuppliersController, SupplierPOsController, GoodsReceiptsController, PurchaseInvoicesController],
  providers: [PurchasesService, SuppliersService, SupplierPOsService, GoodsReceiptsService, PurchaseInvoicesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
