import { MigrationInterface, QueryRunner } from 'typeorm';

export class OidcConfig1772326398311 implements MigrationInterface {
  name = 'OidcConfig1772326398311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_issuer_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_client_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_client_secret" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_callback_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_provider_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "oidc_enabled" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "user_entity" SET "password" = '' WHERE "password" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_callback_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_client_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_client_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_provider_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "oidc_issuer_url"`,
    );
  }
}
