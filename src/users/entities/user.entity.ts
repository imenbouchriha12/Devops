// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ nullable: true })  // Allow null values for optional fields
  phone_number?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.BUSINESS_OWNER,  // anyone who registers gets this role by default
  })
  role!: Role;

  @Column({ default: false })
  is_verified!: boolean;

  @CreateDateColumn()
  created_at!: Date;


  @Column({ default: false })
  is_suspended: boolean; 


  ///HELLLOO NARIII
  @UpdateDateColumn()
  updated_at!: Date;
  
}