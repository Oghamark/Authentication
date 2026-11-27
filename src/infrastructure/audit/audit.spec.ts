import {
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Server } from 'http';
import * as request from 'supertest';
import { AuditMiddleware } from './audit.middleware';
import { AuditService } from './audit.service';
import { AuditController } from 'src/presentation/controllers/audit.controller';
import { JwtAuthGuard } from '../guards/jwt_auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { parseAuditQuery } from './audit-query';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { Result } from 'src/core/result';
import { Logger } from '@nestjs/common';
import { GenericFailure } from 'src/core/failure';
import { UpdateUserUseCase } from 'src/application/use_cases/user/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/user/update_user_role';

const id = 'a327116a-2a7c-49a1-b0f2-4c5660275425';
const target = 'b327116a-2a7c-49a1-b0f2-4c5660275425';
const user = {
  id,
  email: 'person@example.test',
  name: 'Person',
  role: 'ADMIN',
  provider: 'LOCAL',
};
const records: unknown[] = [];

@Injectable()
class TestJwtGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.headers.authorization) throw new UnauthorizedException();
    req.user = {
      ...user,
      role: req.headers.authorization === 'admin' ? 'ADMIN' : 'USER',
    };
    return true;
  }
}

@Injectable()
class RejectGuard {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest<Request>().user = user;
    throw new ForbiddenException();
  }
}

@Controller()
class TestController {
  @Post()
  root(@Req() req: Request) {
    req.user = user;
  }

  @Post('login')
  login(@Req() req: Request) {
    if ((req.body as { password?: string }).password === 'good')
      req.user = user;
    else throw new UnauthorizedException();
  }

  @Patch('users/:id/:token')
  @UseGuards(RejectGuard)
  change() {}

  @Post('refresh')
  refresh() {}

  @Post('silent-failure')
  silentFailure(@Res() res: Response) {
    res.locals.auditOutcomeFailure = true;
    res.status(204).end();
  }

  @Post('users/display-names')
  names() {}

  @Get('login/oidc')
  oidc() {}

  @Get('login/oidc/callback')
  callback(@Req() req: Request, @Res() res: Response) {
    req.user = user;
    if (req.query.success === 'true') res.locals.auditOidcLoginSuccess = true;
    res.redirect('/somewhere');
  }
}

@Module({
  controllers: [TestController, AuditController],
  providers: [
    AuditMiddleware,
    RejectGuard,
    RolesGuard,
    {
      provide: AuditService,
      useValue: {
        record: jest.fn((entry: unknown) => {
          records.push(entry);
          return Promise.resolve();
        }),
        list: jest.fn((query: unknown) => Promise.resolve(query)),
      },
    },
  ],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('/');
  }
}

describe('audit middleware and endpoint', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    records.length = 0;
  });

  it('attributes successful login but not anonymous failure and never records submitted data', async () => {
    await request(app.getHttpServer() as Server)
      .post('/login?secret=hidden')
      .send({ email: 'untrusted', password: 'bad' })
      .expect(401);
    await request(app.getHttpServer() as Server)
      .post('/login?secret=hidden')
      .send({ email: 'untrusted', password: 'good' })
      .expect(201);
    expect(records).toEqual([
      {
        actorId: null,
        actorLabel: null,
        method: 'POST',
        route: '/login',
        resourceIds: {},
        statusCode: 401,
        outcome: 'failure',
      },
      {
        actorId: id,
        actorLabel: user.email,
        method: 'POST',
        route: '/login',
        resourceIds: {},
        statusCode: 201,
        outcome: 'success',
      },
    ]);
  });

  it('captures failed guards with only safe UUID parameters and route templates', async () => {
    await request(app.getHttpServer() as Server)
      .patch(`/users/${target}/${id}?secret=hidden`)
      .send({ password: 'hidden' })
      .expect(403);
    expect(records).toEqual([
      {
        actorId: id,
        actorLabel: user.email,
        method: 'PATCH',
        route: '/users/:id/:token',
        resourceIds: { id: target },
        statusCode: 403,
        outcome: 'failure',
      },
    ]);
  });

  it('captures root routes', async () => {
    await request(app.getHttpServer() as Server)
      .post('/')
      .expect(201);
    expect(records).toEqual([
      {
        actorId: id,
        actorLabel: user.email,
        method: 'POST',
        route: '/',
        resourceIds: {},
        statusCode: 201,
        outcome: 'success',
      },
    ]);
  });

  it('excludes refresh, reads, unknown routes, and failed OIDC redirects', async () => {
    await request(app.getHttpServer() as Server)
      .post('/refresh')
      .expect(201);
    await request(app.getHttpServer() as Server)
      .post('/users/display-names')
      .expect(201);
    await request(app.getHttpServer() as Server)
      .get('/login/oidc')
      .expect(200);
    await request(app.getHttpServer() as Server)
      .post('/not-a-route')
      .expect(404);
    await request(app.getHttpServer() as Server)
      .get('/login/oidc/callback?success=false')
      .expect(302);
    expect(records).toHaveLength(0);
    await request(app.getHttpServer() as Server)
      .get('/login/oidc/callback?success=true&code=secret')
      .expect(302);
    expect(records).toEqual([
      {
        actorId: id,
        actorLabel: user.email,
        method: 'GET',
        route: '/login/oidc/callback',
        resourceIds: {},
        statusCode: 302,
        outcome: 'success',
      },
    ]);
  });

  it('requires authentication and ADMIN and validates the viewer query', async () => {
    await request(app.getHttpServer() as Server)
      .get('/audit-logs')
      .expect(401);
    await request(app.getHttpServer() as Server)
      .get('/audit-logs')
      .set('Authorization', 'user')
      .expect(403);
    await request(app.getHttpServer() as Server)
      .get('/audit-logs?limit=101')
      .set('Authorization', 'admin')
      .expect(400);
    const result = await request(app.getHttpServer() as Server)
      .get('/audit-logs?limit=5&offset=2&actor=person&outcome=failure')
      .set('Authorization', 'admin')
      .expect(200);
    expect(result.body).toEqual({
      limit: 5,
      offset: 2,
      actor: 'person',
      outcome: 'failure',
    });
    expect(records).toHaveLength(0);
  });

  it('reports persistence failures without exposing errors', async () => {
    const audit = app.get(AuditService);
    jest.spyOn(audit, 'record').mockRejectedValueOnce(new Error('secret'));
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    await request(app.getHttpServer() as Server)
      .post('/login')
      .send({ password: 'bad' })
      .expect(401);
    expect(log).toHaveBeenCalledWith('Failed to persist audit log');
    log.mockRestore();
  });

  it('records an explicit result failure marker without storing a body', async () => {
    await request(app.getHttpServer() as Server)
      .post('/silent-failure')
      .expect(204);
    expect(records).toEqual([
      {
        actorId: null,
        actorLabel: null,
        method: 'POST',
        route: '/silent-failure',
        resourceIds: {},
        statusCode: 204,
        outcome: 'failure',
      },
    ]);
  });
});

describe('audit query parsing and filters', () => {
  it('rejects invalid pagination, filters, and date ranges', () => {
    expect(parseAuditQuery({})).toMatchObject({ limit: 25, offset: 0 });
    for (const query of [
      { limit: '0' },
      { limit: '1.5' },
      { offset: '-1' },
      { offset: '10000001' },
      { offset: '9007199254740992' },
      { actor: 'a'.repeat(201) },
      { action: ['bad'] },
      { outcome: 'other' },
      { from: '2024-02-30T00:00:00Z' },
      { to: '2024-01-01' },
      { from: '2025-01-01T00:00:00Z', to: '2024-01-01T00:00:00Z' },
    ])
      expect(() => parseAuditQuery(query)).toThrow();
    expect(parseAuditQuery({ offset: '10000000' }).offset).toBe(10_000_000);
  });

  it('applies literal substring, outcome, date and stable pagination filters', async () => {
    const builder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id }], 12]),
    };
    const service = new AuditService({
      createQueryBuilder: () => builder,
    } as never);
    const result = await service.list(
      parseAuditQuery({
        limit: '3',
        offset: '2',
        actor: 'a%_',
        action: 'DELETE /users',
        outcome: 'failure',
        from: '2024-01-01T00:00:00Z',
        to: '2025-01-01T00:00:00Z',
      }),
    );
    expect(result).toEqual({ data: [{ id }], total: 12, limit: 3, offset: 2 });
    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('actor_label ILIKE'),
      { actor: '%a\\%\\_%' },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("CONCAT(audit.method, ' ', audit.route) ILIKE"),
      { action: '%DELETE /users%' },
    );
    expect(builder.andWhere).toHaveBeenCalledWith('audit.outcome = :outcome', {
      outcome: 'failure',
    });
    expect(builder.andWhere).toHaveBeenCalledWith('audit.created_at >= :from', {
      from: '2024-01-01T00:00:00Z',
    });
    expect(builder.andWhere).toHaveBeenCalledWith('audit.created_at <= :to', {
      to: '2025-01-01T00:00:00Z',
    });
    expect(builder.orderBy).toHaveBeenCalledWith('audit.created_at', 'DESC');
    expect(builder.addOrderBy).toHaveBeenCalledWith('audit.id', 'DESC');
    expect(builder.skip).toHaveBeenCalledWith(2);
    expect(builder.take).toHaveBeenCalledWith(3);
    await service.list(parseAuditQuery({ outcome: 'success' }));
    expect(builder.andWhere).toHaveBeenCalledWith('audit.outcome = :outcome', {
      outcome: 'success',
    });
  });
});

describe('real authentication request attribution', () => {
  it('marks failed refresh token revocation without changing its response', async () => {
    const logout = {
      execute: jest
        .fn()
        .mockResolvedValue(Result.fail(new GenericFailure('private details'))),
    };
    const controller = new AuthController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      logout as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const response = { clearCookie: jest.fn(), locals: {} };
    await expect(
      controller.invalidateRefreshToken(user, 'token', response as never, {}),
    ).resolves.toBeUndefined();
    expect(response.clearCookie).toHaveBeenCalledTimes(2);
    expect(response.locals).toEqual({ auditOutcomeFailure: true });
  });

  it('uses the real request for signup and PKCE exchange', async () => {
    const login = {
      execute: jest.fn().mockResolvedValue(
        Result.ok({
          accessToken: 'access',
          refreshToken: 'refresh',
          userId: id,
        }),
      ),
    };
    const create = { execute: jest.fn().mockResolvedValue(Result.ok(user)) };
    const config = {
      execute: jest.fn().mockResolvedValue(Result.ok({ signupEnabled: true })),
    };
    const pkce = { consume: jest.fn().mockReturnValue(user) };
    const controller = new AuthController(
      create as never,
      {} as never,
      login as never,
      config as never,
      {} as never,
      {} as never,
      pkce as never,
      {} as never,
    );
    const response = { cookie: jest.fn() };
    const signupRequest = {};
    const tokenRequest = {};
    await controller.signUp(
      {} as never,
      response as never,
      signupRequest as never,
    );
    await controller.exchangeToken(
      { code: 'code', codeVerifier: 'verifier' },
      response as never,
      tokenRequest as never,
    );
    expect(signupRequest).toEqual({ user });
    expect(tokenRequest).toEqual({ user });
    expect(login.execute).toHaveBeenNthCalledWith(1, signupRequest);
    expect(login.execute).toHaveBeenNthCalledWith(2, tokenRequest);
  });

  describe('user mutation repository failures', () => {
    it('propagates unsuccessful updates to both mutation controllers', async () => {
      const failure = new GenericFailure('write failed');
      const repository = {
        findById: jest.fn().mockResolvedValue(Result.ok({ ...user })),
        update: jest.fn().mockResolvedValue(Result.fail(failure)),
      };
      const update = new UpdateUserUseCase(repository as never);
      const role = new UpdateUserRoleUseCase(repository as never);
      expect((await update.execute({ id: target } as never)).failure).toBe(
        failure,
      );
      expect(
        (
          await role.execute({
            id: target,
            authenticatedUserId: id,
            role: 'ADMIN',
          })
        ).failure,
      ).toBe(failure);
    });
  });

  it('marks successful OIDC callbacks only after login succeeds', async () => {
    const principal = { ...user, provider: 'OIDC' };
    const thirdParty = {
      execute: jest.fn().mockResolvedValue(Result.ok(principal)),
    };
    const login = {
      execute: jest.fn().mockResolvedValue(
        Result.ok({
          accessToken: 'access',
          refreshToken: 'refresh',
          userId: id,
        }),
      ),
    };
    const controller = new AuthController(
      {} as never,
      thirdParty as never,
      login as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const req = { user: principal, session: {} };
    const res = { cookie: jest.fn(), locals: {} };
    await controller.oidcLoginCallback(req as never, res as never);
    expect(res.locals).toEqual({ auditOidcLoginSuccess: true });
    expect(login.execute).toHaveBeenCalledWith(req);
  });
});
