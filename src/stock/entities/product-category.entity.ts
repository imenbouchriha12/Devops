import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_categories')
@Index(['business_id', 'isActive'])
@Index(['business_id', 'name'])
@Index(['parent_id'])
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant isolation: each business has its own categories
  @Column({ type: 'uuid' })
  @Index()
  business_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Hierarchical categories (parent-child relationship)
  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  // Category code for reporting and filtering
  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  // Sort order for display
  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  // Category image/icon
  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Relations ────────────────────────────────────────────────
  
  // Parent category (for hierarchical structure)
  @ManyToOne(() => ProductCategory, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: ProductCategory;

  // Child categories
  @OneToMany(() => ProductCategory, (category) => category.parent)
  children: ProductCategory[];

  // Products in this category
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
