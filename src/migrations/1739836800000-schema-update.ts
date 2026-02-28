import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1739836800000 implements MigrationInterface {
  name = 'SchemaUpdate1739836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'CHK_user_entity_role'
          AND table_name = 'user_entity'
        ) THEN
          ALTER TABLE "user_entity" ADD CONSTRAINT "CHK_user_entity_role" CHECK ("role" IN ('USER', 'ADMIN'));
        END IF;
      END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP CONSTRAINT "CHK_user_entity_role"`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "role"`);
  }
}
