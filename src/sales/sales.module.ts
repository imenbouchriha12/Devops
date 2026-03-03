
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
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class SalesModule {}
