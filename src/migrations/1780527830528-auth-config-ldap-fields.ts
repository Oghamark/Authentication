import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthConfigLdapFields1780527830528 implements MigrationInterface {
  name = 'AuthConfigLdapFields1780527830528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_user_group" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_admin_group" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_email_field" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD COLUMN IF NOT EXISTS "ldap_name_field" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_name_field"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_email_field"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_admin_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN IF EXISTS "ldap_user_group"`,
    );
  }
}
