import { MigrationInterface, QueryRunner } from 'typeorm';

export class LdapConifg1779396833428 implements MigrationInterface {
  name = 'LdapConfig1779396833428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_base_dn" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_bind_password" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_bind_dn" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_server_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS  "ldap_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "provider" character varying NOT NULL DEFAULT 'LOCAL'`,
    );
    // Can't have LDAP users yet, so anyone without a password must be OIDC.
    await queryRunner.query(
      `UPDATE user_entity SET "provider" = 'OIDC' WHERE "password" IS NULL AND "provider" = 'LOCAL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_server_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_bind_dn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_bind_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_base_dn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_user_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_admin_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_email_field"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_name_field"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN IF EXISTS "provider"`,
    );
  }
}
