import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionTable1773367139650 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid"    VARCHAR        NOT NULL COLLATE "default",
        "sess"   JSON           NOT NULL,
        "expire" TIMESTAMP(6)   NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "session";`);
  }
}
