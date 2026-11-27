import { Controller, INestApplication, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import { Server } from 'http';
import * as request from 'supertest';
import { AuditModule } from 'src/modules/audit.module';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { JwtAccessTokenStrategy } from '../strategies/jwt.strategy';
import { jwtConfig } from '../config';
import { UserController } from 'src/presentation/controllers/user.controller';
import { ConfigController } from 'src/presentation/controllers/config.controller';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { UpdateUserUseCase } from 'src/application/use_cases/user/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/user/update_user_role';
import { GetUsersUseCase } from 'src/application/use_cases/user/get_users';
import { GetUserByIdUseCase } from 'src/application/use_cases/user/get_user_by_id';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/user/delete_user_by_email';
import { SearchUsersUseCase } from 'src/application/use_cases/user/search_users';
import { SearchSocialAccountsUseCase } from 'src/application/use_cases/user/search_social_accounts';
import { GetDisplayNamesUseCase } from 'src/application/use_cases/user/get_display_names';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { UpdateAuthConfigUseCase } from 'src/application/use_cases/config/update_auth_config';
import { OidcStrategyFactory } from '../strategies/oidc.strategy';
import { LdapStrategyFactory } from '../strategies/ldap.strategy';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';

const actorId = 'a327116a-2a7c-49a1-b0f2-4c5660275425';
const targetId = 'b327116a-2a7c-49a1-b0f2-4c5660275425';
const secret = 'test-secret';
const principal = {
  id: actorId,
  email: 'admin@example.test',
  name: 'Admin',
  role: 'ADMIN',
  provider: 'LOCAL',
};
const makeToken = (role: string) =>
  new JwtService().sign({ sub: actorId, ...principal, role }, { secret });
const builder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
};
const repository = {
  insert: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn().mockReturnValue(builder),
};
const createUser = { execute: jest.fn() };
const updateUser = { execute: jest.fn() };
const updateRole = { execute: jest.fn() };
const deleteUser = { execute: jest.fn() };
const updateConfig = { execute: jest.fn() };
const empty = { execute: jest.fn() };

@Controller()
class RootController {
  @Post()
  create() {
    return { success: true };
  }
}

@Module({
  imports: [AuditModule, PassportModule],
  controllers: [UserController, ConfigController, RootController],
  providers: [
    JwtAccessTokenStrategy,
    { provide: jwtConfig.KEY, useValue: { jwtAccessSecret: secret } },
    { provide: CreateUserUseCase, useValue: createUser },
    { provide: UpdateUserUseCase, useValue: updateUser },
    { provide: UpdateUserRoleUseCase, useValue: updateRole },
    { provide: DeleteUserByEmailUseCase, useValue: deleteUser },
    { provide: GetUsersUseCase, useValue: empty },
    { provide: GetUserByIdUseCase, useValue: empty },
    { provide: SearchUsersUseCase, useValue: empty },
    { provide: SearchSocialAccountsUseCase, useValue: empty },
    { provide: GetDisplayNamesUseCase, useValue: empty },
    { provide: GetAuthConfigUseCase, useValue: empty },
    { provide: UpdateAuthConfigUseCase, useValue: updateConfig },
    { provide: OidcStrategyFactory, useValue: {} },
    { provide: LdapStrategyFactory, useValue: {} },
  ],
})
class IntegrationModule {}

describe('production audit module integration', () => {
  let app: INestApplication;
  const adminCookie = `access_token=${makeToken('ADMIN')}`;
  const userCookie = `access_token=${makeToken('USER')}`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [IntegrationModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue(repository)
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records non-root writes and actual JWT and role guard failures', async () => {
    updateUser.execute.mockResolvedValue(Result.ok(principal));
    const server = app.getHttpServer() as Server;
    await request(server)
      .patch(`/users/${targetId}?token=secret`)
      .send({ password: 'secret' })
      .expect(401);
    await request(server)
      .patch(`/users/${targetId}`)
      .set('Cookie', userCookie)
      .send({ password: 'secret' })
      .expect(403);
    await request(server)
      .patch(`/users/${targetId}`)
      .set('Cookie', adminCookie)
      .send({ password: 'secret' })
      .expect(200);
    expect(repository.insert.mock.calls).toEqual([
      [
        {
          actorId: null,
          actorLabel: null,
          method: 'PATCH',
          route: '/users/:id',
          resourceIds: { id: targetId },
          statusCode: 401,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'PATCH',
          route: '/users/:id',
          resourceIds: { id: targetId },
          statusCode: 403,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'PATCH',
          route: '/users/:id',
          resourceIds: { id: targetId },
          statusCode: 200,
          outcome: 'success',
        },
      ],
    ]);
    expect(updateUser.execute).toHaveBeenCalledTimes(1);
  });

  it('also records root writes once', async () => {
    await request(app.getHttpServer() as Server)
      .post('/')
      .expect(201);
    expect(repository.insert).toHaveBeenCalledTimes(1);
    expect(repository.insert).toHaveBeenCalledWith({
      actorId: null,
      actorLabel: null,
      method: 'POST',
      route: '/',
      resourceIds: {},
      statusCode: 201,
      outcome: 'success',
    });
  });

  it('enforces real admin guards on the audit viewer and validates offsets', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).get('/audit-logs').expect(401);
    await request(server)
      .get('/audit-logs')
      .set('Cookie', userCookie)
      .expect(403);
    await request(server)
      .get('/audit-logs?offset=10000001')
      .set('Cookie', adminCookie)
      .expect(400);
    const entry = {
      id: targetId,
      createdAt: '2026-01-01T00:00:00.000Z',
      actorId,
      actorLabel: principal.email,
      method: 'DELETE',
      route: '/users',
      resourceIds: {},
      statusCode: 200,
      outcome: 'failure',
    };
    builder.getManyAndCount.mockResolvedValueOnce([[entry], 1]);
    const result = await request(server)
      .get('/audit-logs?action=DELETE&offset=10000000&outcome=failure')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(result.body).toEqual({
      data: [entry],
      total: 1,
      limit: 25,
      offset: 10000000,
    });
    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("CONCAT(audit.method, ' ', audit.route) ILIKE"),
      { action: '%DELETE%' },
    );
    expect(builder.andWhere).toHaveBeenCalledWith('audit.outcome = :outcome', {
      outcome: 'failure',
    });
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('records failed user and configuration results without changing HTTP status', async () => {
    const failure = Result.fail(new GenericFailure('private details'));
    createUser.execute.mockResolvedValue(failure);
    updateUser.execute.mockResolvedValue(failure);
    updateRole.execute.mockResolvedValue(failure);
    deleteUser.execute.mockResolvedValue(failure);
    updateConfig.execute.mockResolvedValue(failure);
    const server = app.getHttpServer() as Server;
    await request(server)
      .post('/users')
      .set('Cookie', adminCookie)
      .send({ email: 'hidden@example.test' })
      .expect(201);
    await request(server)
      .patch(`/users/${targetId}`)
      .set('Cookie', adminCookie)
      .send({ name: 'hidden' })
      .expect(200);
    await request(server)
      .patch(`/users/${targetId}/role`)
      .set('Cookie', adminCookie)
      .send({ role: 'ADMIN' })
      .expect(200);
    await request(server)
      .delete('/users')
      .set('Cookie', adminCookie)
      .send({ email: 'hidden@example.test' })
      .expect(200);
    await request(server)
      .patch('/config')
      .set('Cookie', adminCookie)
      .send({ oidcClientSecret: 'hidden' })
      .expect(200);
    expect(repository.insert.mock.calls).toEqual([
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'POST',
          route: '/users',
          resourceIds: {},
          statusCode: 201,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'PATCH',
          route: '/users/:id',
          resourceIds: { id: targetId },
          statusCode: 200,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'PATCH',
          route: '/users/:id/role',
          resourceIds: { id: targetId },
          statusCode: 200,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'DELETE',
          route: '/users',
          resourceIds: {},
          statusCode: 200,
          outcome: 'failure',
        },
      ],
      [
        {
          actorId,
          actorLabel: principal.email,
          method: 'PATCH',
          route: '/config',
          resourceIds: {},
          statusCode: 200,
          outcome: 'failure',
        },
      ],
    ]);
  });
});
