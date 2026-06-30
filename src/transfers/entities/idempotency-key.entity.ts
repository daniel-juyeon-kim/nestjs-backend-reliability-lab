import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type IdempotencyKeyStatus = 'processing' | 'completed';

@Entity({ name: 'idempotency_keys' })
@Unique(['userId', 'key'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: 'varchar', length: 64 })
  requestHash!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: IdempotencyKeyStatus;

  @Column({ type: 'int', nullable: true })
  statusCode!: number | null;

  @Column({ type: 'json', nullable: true })
  responseBody!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
