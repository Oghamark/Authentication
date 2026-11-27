import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';
import { RolesGuard } from 'src/infrastructure/guards/roles.guard';
import { parseAuditQuery } from 'src/infrastructure/audit/audit-query';
import { AuditService } from 'src/infrastructure/audit/audit.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.audit.list(parseAuditQuery(query));
  }
}
