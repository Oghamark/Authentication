import { MigrationInterface, QueryRunner } from 'typeorm';

export class LdapConifg1779396833428 implements MigrationInterface {
  name = 'LdapConfig1779396833428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN "ldap_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN "ldap_server_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN "ldap_bind_dn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN "ldap_bind_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" DROP COLUMN "ldap_base_dn"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD "ldap_base_dn" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD "ldap_bind_password" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD "ldap_bind_dn" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD "ldap_server_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_config" ADD "ldap_enabled" boolean NOT NULL DEFAULT false`,
    );
  }
}
