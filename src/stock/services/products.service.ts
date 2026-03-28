import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductsDto } from '../dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(businessId: string, dto: CreateProductDto): Promise<Product> {
    // Check if reference already exists for this business
    const existing = await this.productRepo.findOne({
      where: {
        business_id: businessId,
        reference: dto.reference,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Product with reference ${dto.reference} already exists`,
      );
    }

    const product = this.productRepo.create({
      ...dto,
      business_id: businessId,
    });

    return await this.productRepo.save(product);
  }

  async findAll(
    businessId: string,
    query: QueryProductsDto,
  ): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.business_id = :businessId', { businessId });

    if (query.is_active !== undefined) {
      qb.andWhere('product.is_active = :isActive', {
        isActive: query.is_active,
      });
    }

    if (query.category_id) {
      qb.andWhere('product.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.reference ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.low_stock) {
      qb.andWhere('product.current_stock < product.min_stock_threshold');
    }

    qb.orderBy('product.name', 'ASC');

    return await qb.getMany();
  }

  async findOne(businessId: string, id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, business_id: businessId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(businessId, id);

    // Check reference uniqueness if being updated
    if (dto.reference && dto.reference !== product.reference) {
      const existing = await this.productRepo.findOne({
        where: {
          business_id: businessId,
          reference: dto.reference,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Product with reference ${dto.reference} already exists`,
        );
      }
    }

    Object.assign(product, dto);

    return await this.productRepo.save(product);
  }

  async remove(businessId: string, id: string): Promise<void> {
    const product = await this.findOne(businessId, id);

    // Soft delete
    product.is_active = false;
    await this.productRepo.save(product);
  }

  async getAlerts(businessId: string): Promise<Product[]> {
    return await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.business_id = :businessId', { businessId })
      .andWhere('product.is_active = :active', { active: true })
      .andWhere('product.is_stockable = :stockable', { stockable: true })
      .andWhere('product.current_stock < product.min_stock_threshold')
      .orderBy('product.current_stock', 'ASC')
      .getMany();
  }
}
