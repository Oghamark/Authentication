import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthConfig1772326398310 implements MigrationInterface {
  name = 'AuthConfig1772326398310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "auth_config" ("id" character varying NOT NULL, "signup_enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_auth_config" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "auth_config" ("id", "signup_enabled") VALUES ('default', true) ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_config"`);
  }
}
