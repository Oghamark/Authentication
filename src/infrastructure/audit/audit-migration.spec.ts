import { QueryRunner } from 'typeorm';
import { AuditLog1780527830529 } from 'src/migrations/1780527830529-audit-log';

describe('audit log migration', () => {
  it('creates outcome with a constrained default and drops the table on rollback', async () => {
    const queryRunner = {
      query: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    };
    const migration = new AuditLog1780527830529();

    await migration.up(queryRunner as unknown as QueryRunner);
    const createTable = queryRunner.query.mock.calls[0][0];
    expect(createTable).toContain(
      `"outcome" varchar(7) NOT NULL DEFAULT 'success'`,
    );
    expect(createTable).toContain(
      `CONSTRAINT "CHK_audit_log_outcome" CHECK ("outcome" IN ('success', 'failure'))`,
    );

    await migration.down(queryRunner as unknown as QueryRunner);
    expect(queryRunner.query).toHaveBeenLastCalledWith(
      'DROP TABLE "audit_log"',
    );
  });
});
