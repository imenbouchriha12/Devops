// ══════════════════════════════════════════════════════════════════════════════
// FICHIER 1 — src/Purchases/purchases.module.ts
// ══════════════════════════════════════════════════════════════════════════════
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule }      from '@nestjs/typeorm';
import { HttpModule }         from '@nestjs/axios';
import { ScheduleModule }     from '@nestjs/schedule';
import { MulterModule }       from '@nestjs/platform-express';
import { JwtModule }          from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
 
// Entités — SupplierPayment RETIRÉ (géré par PaymentsModule)
import { GoodsReceipt }        from './entities/goods-receipt.entity';
import { GoodsReceiptItem }    from './entities/goods-receipt-item.entity';
import { PurchaseInvoice }     from './entities/purchase-invoice.entity';
import { SupplierPOItem }      from './entities/supplier-po-item.entity';
import { SupplierPO }          from './entities/supplier-po.entity';
import { Supplier }            from './entities/supplier.entity';
import { SupplierPortalToken } from './entities/supplier-portal-token.entity';
import { PurchaseAlert }       from './entities/purchase-alert.entity';
import { Business }            from 'src/businesses/entities/business.entity';
 
// Controllers — SupplierPaymentsController RETIRÉ (dans PaymentsModule)
import { PurchasesController }        from './purchases.controller';
import { SuppliersController }        from './controllers/suppliers.controller';
import { SupplierPOsController }      from './controllers/supplier-pos.controller';
import { GoodsReceiptsController }    from './controllers/goods-receipts.controller';
import { PurchaseInvoicesController } from './controllers/purchase-invoices.controller';
import { SupplierPortalController }   from './controllers/supplier-portal.controller';
import { UploadController }           from './controllers/upload.controller';
import { PurchaseAlertsController }   from './controllers/purchase-alerts.controller';
import { ThreeWayMatchingController } from './controllers/three-way-matching.controller';
import { OcrController }              from './controllers/ocr.controller';
 
// Services — SupplierPaymentsService RETIRÉ (dans PaymentsModule)
import { PurchasesService }        from './purchases.service';
import { SuppliersService }        from './services/suppliers.service';
import { SupplierPOsService }      from './services/supplier-pos.service';
import { GoodsReceiptsService }    from './services/goods-receipts.service';
import { PurchaseInvoicesService } from './services/purchase-invoices.service';
import { PurchaseMailService }     from './services/purchase-mail.service';
import { SupplierPortalService }   from './services/supplier-portal.service';
import { PurchaseAlertsService }   from './services/purchase-alerts.service';
import { ThreeWayMatchingService } from './services/three-way-matching.service';
import { SupplierScoringService }  from './services/supplier-scoring.service';
import { OcrService }              from './services/ocr.service';
 
// FIX : import du module payments avec forwardRef des DEUX côtés
import { PaymentsModule } from 'src/payments/payments.module';
import { SupplierScoringController } from './services/supplier-scoring.controller';
 
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoodsReceipt, GoodsReceiptItem, PurchaseInvoice,
      SupplierPOItem, SupplierPO, Supplier,
      SupplierPortalToken, PurchaseAlert, Business,
      // SupplierPayment retiré — dans PaymentsModule
    ]),
    forwardRef(() => PaymentsModule), // ← FIX : forwardRef des deux côtés
    HttpModule,
    ScheduleModule.forRoot(),
    MulterModule.register({ dest: './uploads' }),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('JWT_PORTAL_SECRET', 'portal_secret_key_change_me'),
        signOptions: { expiresIn: '72h' },
      }),
      inject: [ConfigService],
    }),
  ],
 
  controllers: [
    PurchasesController,
    SuppliersController,
    SupplierPOsController,
    GoodsReceiptsController,
    PurchaseInvoicesController,
    //UploadController,
    SupplierPortalController,
    PurchaseAlertsController,
    ThreeWayMatchingController,
    SupplierScoringController,
    OcrController,

  ],
 
  providers: [
    PurchasesService,
    SuppliersService,
    SupplierPOsService,
    GoodsReceiptsService,
    PurchaseInvoicesService,
    PurchaseMailService,
    SupplierPortalService,
    PurchaseAlertsService,
    ThreeWayMatchingService,
    SupplierScoringService,
    OcrService,

  ],
 
  exports: [
    PurchasesService,
    PurchaseInvoicesService,
    SuppliersService,        // ← exporter SuppliersService pour PaymentsModule
    TypeOrmModule,           // ← exporter les repositories pour PaymentsModule
  ],
})
export class PurchasesModule {}
 