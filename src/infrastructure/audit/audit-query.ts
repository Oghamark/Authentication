import { BadRequestException } from '@nestjs/common';
import { isISO8601 } from 'class-validator';

export interface AuditQuery {
  limit: number;
  offset: number;
  actor?: string;
  action?: string;
  outcome?: 'success' | 'failure';
  from?: string;
  to?: string;
}

export function parseAuditQuery(input: Record<string, unknown>): AuditQuery {
  const text = (key: string) => {
    const value = input[key];
    if (value !== undefined && typeof value !== 'string')
      throw new BadRequestException(`Invalid ${key}`);
    return value;
  };
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const value = text(key);
    if (value === undefined) return fallback;
    if (!/^\d+$/.test(value)) throw new BadRequestException(`Invalid ${key}`);
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < min || result > max)
      throw new BadRequestException(`Invalid ${key}`);
    return result;
  };
  const limit = integer('limit', 25, 1, 100);
  const offset = integer('offset', 0, 0, 10_000_000);
  const actor = text('actor');
  const action = text('action');
  if ((actor?.length ?? 0) > 200 || (action?.length ?? 0) > 200)
    throw new BadRequestException('Search text is too long');
  const outcome = text('outcome');
  if (outcome !== undefined && outcome !== 'success' && outcome !== 'failure')
    throw new BadRequestException('Invalid outcome');
  const timestamp = (key: string) => {
    const value = text(key);
    if (
      value !== undefined &&
      (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/i.test(
        value,
      ) ||
        !isISO8601(value, { strict: true }) ||
        !Number.isFinite(Date.parse(value)))
    )
      throw new BadRequestException(`Invalid ${key}`);
    return value;
  };
  const from = timestamp('from');
  const to = timestamp('to');
  if (from && to && Date.parse(from) > Date.parse(to))
    throw new BadRequestException('Invalid date range');
  return { limit, offset, actor, action, outcome, from, to };
}
