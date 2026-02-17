import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1739836800000 implements MigrationInterface {
  name = 'SchemaUpdate1739836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "role" character varying NOT NULL DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "role"`,
    );
  }
}
