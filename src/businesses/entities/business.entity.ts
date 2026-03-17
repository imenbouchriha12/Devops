// src/businesses/entities/business.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Supplier } from 'src/Purchases/entities/supplier.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true })
  logo: string;

  // Matricule Fiscal (Tunisian Tax ID)
  // Format: NNNNNNN/X/A/E/NNN (7-20 chars)
  @Column({ nullable: true })
  tax_id: string;

  @Column({ default: 'TND' })
  currency: string; // Default to Tunisian Dinar

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tax_rate: number; // TVA rate (e.g., 19.00 for 19%)

  @Column({ type: 'json', nullable: true })
  address: object; // { street, city, postal_code, country }

  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}