import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { Product } from '../entities/product.entity';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { CreateInternalStockMovementDto } from '../dto/create-internal-stock-movement.dto';
import { QueryStockMovementsDto } from '../dto/query-stock-movements.dto';
import {
  StockMovementType,
  isIncrementType,
  isDecrementType,
} from '../enums/stock-movement-type.enum';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a manual stock movement (from frontend)
   * Used by BUSINESS_OWNER/ADMIN for manual adjustments
   */
  async createManual(
    businessId: string,
    dto: CreateStockMovementDto,
    userId?: string,
  ): Promise<StockMovement> {
    return this.createMovement({
      business_id: businessId,
      product_id: dto.product_id,
      type: dto.type,
      quantity: dto.quantity,
      source_type: dto.source_type || undefined,
      source_id: dto.source_id || undefined,
      note: dto.note || undefined,
      created_by: userId || undefined,
    });
  }

  /**
   * Create an internal stock movement (from other modules)
   * No authentication required - called by backend services
   */
  async createInternal(
    dto: CreateInternalStockMovementDto,
  ): Promise<StockMovement> {
    return this.createMovement(dto);
  }

  /**
   * Core logic for creating stock movements
   * IMPORTANT: This is the ONLY way to update product stock
   */
  private async createMovement(
    data: CreateInternalStockMovementDto,
  ): Promise<StockMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch and lock the product
      const product = await queryRunner.manager.findOne(Product, {
        where: {
          id: data.product_id,
          business_id: data.business_id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${data.product_id} not found`,
        );
      }

      if (!product.is_stockable) {
        throw new BadRequestException(
          `Product ${product.name} is not stockable`,
        );
      }

      // 2. Validate quantity
      if (data.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      // 3. Get current stock
      const stock_before = product.current_stock;

      // 4. Calculate stock_after based on movement type
      let stock_after: number;

      if (isIncrementType(data.type)) {
        stock_after = stock_before + data.quantity;
      } else if (isDecrementType(data.type)) {
        stock_after = stock_before - data.quantity;

        // Prevent negative stock
        if (stock_after < 0) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${stock_before}, Required: ${data.quantity}`,
          );
        }
      } else {
        throw new BadRequestException(`Invalid movement type: ${data.type}`);
      }

      // 5. Create stock movement record
      const movement = queryRunner.manager.create(StockMovement, {
        product_id: data.product_id,
        business_id: data.business_id,
        type: data.type,
        quantity: data.quantity,
        stock_before,
        stock_after,
        source_type: data.source_type || null,
        source_id: data.source_id || null,
        note: data.note || null,
        created_by: data.created_by || null,
      });

      await queryRunner.manager.save(movement);

      // 6. Update product stock (ONLY place where stock is updated)
      product.current_stock = stock_after;
      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();

      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get stock movements with filters
   */
  async findAll(
    businessId: string,
    query: QueryStockMovementsDto,
  ): Promise<{ data: StockMovement[]; total: number }> {
    const qb = this.movementRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .where('movement.business_id = :businessId', { businessId });

    // Filter by product
    if (query.product_id) {
      qb.andWhere('movement.product_id = :productId', {
        productId: query.product_id,
      });
    }

    // Filter by type
    if (query.type) {
      qb.andWhere('movement.type = :type', { type: query.type });
    }

    // Filter by date range
    if (query.start_date && query.end_date) {
      qb.andWhere('movement.created_at BETWEEN :startDate AND :endDate', {
        startDate: query.start_date,
        endDate: query.end_date,
      });
    } else if (query.start_date) {
      qb.andWhere('movement.created_at >= :startDate', {
        startDate: query.start_date,
      });
    } else if (query.end_date) {
      qb.andWhere('movement.created_at <= :endDate', {
        endDate: query.end_date,
      });
    }

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    qb.orderBy('movement.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    const data = await qb.getMany();

    return { data, total };
  }

  /**
   * Get a single stock movement
   */
  async findOne(businessId: string, id: string): Promise<StockMovement> {
    const movement = await this.movementRepo.findOne({
      where: { id, business_id: businessId },
      relations: ['product'],
    });

    if (!movement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }

    return movement;
  }

  /**
   * Get stock movement history for a product
   */
  async getProductHistory(
    businessId: string,
    productId: string,
    limit = 50,
  ): Promise<StockMovement[]> {
    return this.movementRepo.find({
      where: {
        business_id: businessId,
        product_id: productId,
      },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get stock movements by source (e.g., all movements from an invoice)
   */
  async getBySource(
    businessId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<StockMovement[]> {
    return this.movementRepo.find({
      where: {
        business_id: businessId,
        source_type: sourceType,
        source_id: sourceId,
      },
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get stock summary for a product
   */
  async getProductStockSummary(
    businessId: string,
    productId: string,
  ): Promise<{
    current_stock: number;
    total_entries: number;
    total_exits: number;
    last_movement: StockMovement | null;
  }> {
    const product = await this.productRepo.findOne({
      where: { id: productId, business_id: businessId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const movements = await this.movementRepo.find({
      where: { business_id: businessId, product_id: productId },
      order: { created_at: 'DESC' },
    });

    const total_entries = movements
      .filter((m) => isIncrementType(m.type))
      .reduce((sum, m) => sum + m.quantity, 0);

    const total_exits = movements
      .filter((m) => isDecrementType(m.type))
      .reduce((sum, m) => sum + m.quantity, 0);

    const last_movement = movements[0] || null;

    return {
      current_stock: product.current_stock,
      total_entries,
      total_exits,
      last_movement,
    };
  }
}
