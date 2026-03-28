import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Product }   from './product.entity';
import { Business }  from '../../businesses/entities/business.entity';
 
@Entity('categories')
@Index(['business_id', 'is_active'])
@Index(['business_id', 'name'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ type: 'uuid' })
  @Index()
  business_id: string;
 
  @ManyToOne(() => Business, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;
 
  @Column({ type: 'varchar', length: 255 })
  name: string;
 
  @Column({ type: 'text', nullable: true })
  description: string | null;
 
  @Column({ type: 'boolean', default: true })
  is_active: boolean;
 
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
 
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
 
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}