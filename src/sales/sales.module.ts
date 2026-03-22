
// src/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { QuotesService } from './services/quotes.service';
import { SalesOrdersService } from './services/sales-orders.service';
import { DeliveryNotesService } from './services/delivery-notes.service';
import { InvoicesService } from './services/invoices.service';
import { QuotesController } from './controllers/quotes.controller';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { DeliveryNotesController } from './controllers/delivery-notes.controller';
import { InvoicesController } from './controllers/invoices.controller';

@Module({
  imports: [
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
    ]),
  ],
  providers: [
    QuotesService,
    SalesOrdersService,
    DeliveryNotesService,
    InvoicesService,
  ],
  controllers: [
    QuotesController,
    SalesOrdersController,
    DeliveryNotesController,
    InvoicesController,
  ],
  exports: [
    QuotesService,
    SalesOrdersService,
    DeliveryNotesService,
    InvoicesService,
  ],
})
export class SalesModule {}
