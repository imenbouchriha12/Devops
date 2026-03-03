import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ActivityLogEntityType {
  TASK = 'TASK',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export enum ActivityLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  COMPLETE = 'COMPLETE',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ActivityLogEntityType,
  })
  entityType: ActivityLogEntityType;

  @Column('uuid')
  entityId: string;

  @Column({
    type: 'enum',
    enum: ActivityLogAction,
  })
  action: ActivityLogAction;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
