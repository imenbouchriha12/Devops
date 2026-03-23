// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone_number?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.BUSINESS_OWNER,
  })
  role!: Role;

  @Column({ default: false })
  is_verified!: boolean;

  @Column({ default: false })
  is_suspended: boolean;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  job_title?: string;

  @Column({ nullable: true })
  password_reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}