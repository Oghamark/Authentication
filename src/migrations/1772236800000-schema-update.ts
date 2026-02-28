import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1772236800000 implements MigrationInterface {
  name = 'SchemaUpdate1772236800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "app_config" ("id" integer NOT NULL, "signupEnabled" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_app_config" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "app_config" ("id", "signupEnabled") VALUES (1, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_config"`);
  }
}
