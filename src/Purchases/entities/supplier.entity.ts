import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Business } from 'src/businesses/entities/business.entity';


@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  taxNumber: string; // Matricule fiscal

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  bankAccount: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  paymentTerms: string; // ex: 30 days

  @Column({ default: true })
  isActive: boolean;

  // Multi-tenant relation
@ManyToOne(() => Business, (business) => business.suppliers, {
    onDelete: 'CASCADE',
  })
  business: Business;

  // Optional supplier portal account
  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}