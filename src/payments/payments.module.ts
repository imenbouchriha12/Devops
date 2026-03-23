import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule }      from '@nestjs/typeorm';
import { Account }            from './entities/account.entity';
import { Payment }            from './entities/payment.entity';
import { SupplierPayment }    from './entities/supplier-payment.entity';
import { Transaction }        from './entities/transaction.entity';
import { PaymentsController }         from './payments.controller';
import { SupplierPaymentsController } from './controllers/supplier-payments.controller';
import { PaymentsService }            from './payments.service';
import { SupplierPaymentsService }    from './services/supplier-payments.service';
import { PurchasesModule }            from 'src/Purchases/purchases.module';
 
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Payment,
      SupplierPayment,
      Transaction,
    ]),
    forwardRef(() => PurchasesModule), // ← déjà correct
  ],
  controllers: [PaymentsController, SupplierPaymentsController],
  providers: [PaymentsService, SupplierPaymentsService],
  exports: [
    SupplierPaymentsService,
    PaymentsService,
    TypeOrmModule, // ← expose SupplierPaymentRepository aux modules qui importent PaymentsModule
  ],
})
export class PaymentsModule {}