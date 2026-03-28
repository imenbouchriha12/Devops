import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from '../entities/product-category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoriesDto } from '../dto/query-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(
    businessId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const category = this.categoryRepo.create({
      ...dto,
      business_id: businessId,
    });

    return await this.categoryRepo.save(category);
  }

  async findAll(
    businessId: string,
    query: QueryCategoriesDto,
  ): Promise<Category[]> {
    const where: any = { business_id: businessId };

    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    return await this.categoryRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(businessId: string, id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id, business_id: businessId },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(businessId, id);

    Object.assign(category, dto);

    return await this.categoryRepo.save(category);
  }

  async remove(businessId: string, id: string): Promise<void> {
    const category = await this.findOne(businessId, id);

    // Check if category has products
    const productsCount = await this.categoryRepo
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .where('category.id = :id', { id })
      .andWhere('category.business_id = :businessId', { businessId })
      .andWhere('product.is_active = :active', { active: true })
      .getCount();

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productsCount} active products. Please reassign or deactivate products first.`,
      );
    }

    // Soft delete
    category.is_active = false;
    await this.categoryRepo.save(category);
  }
}
