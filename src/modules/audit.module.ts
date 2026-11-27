import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from 'src/infrastructure/database/entities/audit-log.entity';
import { AuditController } from 'src/presentation/controllers/audit.controller';
import { AuditMiddleware } from 'src/infrastructure/audit/audit.middleware';
import { AuditService } from 'src/infrastructure/audit/audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController],
  providers: [AuditService, AuditMiddleware],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
