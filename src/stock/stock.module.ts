import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/product-category.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Business } from '../businesses/entities/business.entity';

// Controllers
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import {
  StockMovementsController,
  InternalStockMovementsController,
} from './controllers/stock-movements.controller';

// Services
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';
import { StockMovementsService } from './services/stock-movements.service';

// Import BusinessesModule for BusinessAccessGuard dependencies
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, StockMovement, Business]),
    BusinessesModule,
  ],
  controllers: [
    CategoriesController,
    ProductsController,
    StockMovementsController,
    InternalStockMovementsController,
  ],
  providers: [
    CategoriesService,
    ProductsService,
    StockMovementsService,
  ],
  exports: [
    TypeOrmModule,
    CategoriesService,
    ProductsService,
    StockMovementsService,
  ],
})
export class StockModule {}
