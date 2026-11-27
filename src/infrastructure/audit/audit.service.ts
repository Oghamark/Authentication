import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { AuditQuery } from './audit-query';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async record(entry: Omit<AuditLogEntity, 'id' | 'createdAt'>) {
    await this.repository.insert(entry);
  }

  async list(query: AuditQuery) {
    const builder = this.repository.createQueryBuilder('audit');
    const escape = (value: string) => value.replace(/[\\%_]/g, '\\$&');
    if (query.actor !== undefined) {
      builder.andWhere(
        "(CAST(audit.actor_id AS text) ILIKE :actor ESCAPE '\\' OR audit.actor_label ILIKE :actor ESCAPE '\\')",
        { actor: `%${escape(query.actor)}%` },
      );
    }
    if (query.action !== undefined) {
      builder.andWhere(
        "CONCAT(audit.method, ' ', audit.route) ILIKE :action ESCAPE '\\'",
        {
          action: `%${escape(query.action)}%`,
        },
      );
    }
    if (query.outcome) {
      builder.andWhere('audit.outcome = :outcome', { outcome: query.outcome });
    }
    if (query.from)
      builder.andWhere('audit.created_at >= :from', { from: query.from });
    if (query.to) builder.andWhere('audit.created_at <= :to', { to: query.to });
    const [data, total] = await builder
      .orderBy('audit.created_at', 'DESC')
      .addOrderBy('audit.id', 'DESC')
      .skip(query.offset)
      .take(query.limit)
      .getManyAndCount();
    return { data, total, limit: query.limit, offset: query.offset };
  }
}
