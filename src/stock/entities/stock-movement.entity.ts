import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { StockMovementType } from '../enums/stock-movement-type.enum';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
  })
  type: StockMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
