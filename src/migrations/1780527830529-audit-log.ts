import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLog1780527830529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "actor_id" uuid,
        "actor_label" text,
        "method" varchar(10) NOT NULL,
        "route" text NOT NULL,
        "resource_ids" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status_code" integer NOT NULL,
        "outcome" varchar(7) NOT NULL DEFAULT 'success',
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_audit_log_outcome" CHECK ("outcome" IN ('success', 'failure'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_log_created_at_id" ON "audit_log" ("created_at", "id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "audit_log"');
  }
}
