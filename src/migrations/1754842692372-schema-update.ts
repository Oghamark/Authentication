import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1754842692372 implements MigrationInterface {
  name = 'SchemaUpdate1754842692372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP CONSTRAINT "CHK_user_entity_role"`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "role"`);
  }
}
