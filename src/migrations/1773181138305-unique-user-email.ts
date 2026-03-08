import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueUserEmail1773181138305 implements MigrationInterface {
  name = 'UniqueUserEmail1773181138305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP CONSTRAINT IF EXISTS "UQ_user_email"`,
    );
  }
}
