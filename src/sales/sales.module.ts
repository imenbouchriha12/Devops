// src/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { DeliveryNote } from './entities/delivery-note.entity';
import { DeliveryNoteItem } from './entities/delivery-note-item.entity';
import { StockExit } from './entities/stock-exit.entity';
import { StockExitItem } from './entities/stock-exit-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { RecurringInvoice } from './entities/recurring-invoice.entity';
import { QuotesService } from './services/quotes.service';
import { SalesOrdersService } from './services/sales-orders.service';
import { DeliveryNotesService } from './services/delivery-notes.service';
import { InvoicesService } from './services/invoices.service';
import { SalesMailService } from './services/sales-mail.service';
import { SalesOcrService } from './services/sales-ocr.service';
import { InvoiceCronService } from './services/invoice-cron.service';
import { RecurringInvoicesService } from './services/recurring-invoices.service';
import { RecurringInvoiceCronService } from './services/recurring-invoice-cron.service';
import { QuotesController } from './controllers/quotes.controller';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { DeliveryNotesController } from './controllers/delivery-notes.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { SalesOcrController } from './controllers/sales-ocr.controller';
import { RecurringInvoicesController } from './controllers/recurring-invoices.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Quote,
      QuoteItem,
      SalesOrder,
      SalesOrderItem,
      DeliveryNote,
      DeliveryNoteItem,
      StockExit,
      StockExitItem,
      Invoice,
      InvoiceItem,
      RecurringInvoice,
    ]),
  ],
  providers: [
    QuotesService,
    SalesOrdersService,
    DeliveryNotesService,
    InvoicesService,
    SalesMailService,
    SalesOcrService,
    InvoiceCronService,
    RecurringInvoicesService,
    RecurringInvoiceCronService,
  ],
  controllers: [
    QuotesController,
    SalesOrdersController,
    DeliveryNotesController,
    InvoicesController,
    SalesOcrController,
    RecurringInvoicesController,
  ],
  exports: [
    QuotesService,
    SalesOrdersService,
    DeliveryNotesService,
    InvoicesService,
    SalesMailService,
    SalesOcrService,
    RecurringInvoicesService,
  ],
})
export class SalesModule {}

