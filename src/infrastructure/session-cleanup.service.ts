import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredSessions(): Promise<void> {
    const result: [unknown, number] = await this.dataSource.query(
      `DELETE FROM "session" WHERE "expire" < NOW()`,
    );
    const rowsDeleted = result[1] ?? 0;
    if (rowsDeleted > 0) {
      this.logger.log(`Removed ${rowsDeleted} expired session(s)`);
    }
  }
}
