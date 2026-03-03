import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { StockMovement } from './entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategory, StockMovement]),
  ],
  exports: [TypeOrmModule],
})
export class StockModule {}
