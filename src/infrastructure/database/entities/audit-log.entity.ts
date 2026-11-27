import { Check, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_log')
@Check('CHK_audit_log_outcome', `"outcome" IN ('success', 'failure')`)
@Index('IDX_audit_log_created_at_id', ['createdAt', 'id'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_label', type: 'text', nullable: true })
  actorLabel: string | null;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'text' })
  route: string;

  @Column({ name: 'resource_ids', type: 'jsonb', default: () => "'{}'::jsonb" })
  resourceIds: Record<string, string>;

  @Column({ name: 'status_code', type: 'integer' })
  statusCode: number;

  @Column({ type: 'varchar', length: 7, default: 'success' })
  outcome: 'success' | 'failure';
}
