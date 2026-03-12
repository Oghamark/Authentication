import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionCleanupService } from 'src/infrastructure/session-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SessionCleanupService],
})
export class SessionModule {}
