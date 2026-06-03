import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';
import { isObservable, lastValueFrom } from 'rxjs';

@Injectable()
export class LdapAuthGuard extends AuthGuard('ldap') implements CanActivate {
  constructor(
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {
    super();
  }

  private readonly logger = new Logger('LdapAuthGuard');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const superResult = await super.canActivate(context);
    if (isObservable(superResult)) {
      return lastValueFrom(superResult);
    } else {
      return superResult;
    }
  }

  handleRequest<T>(err: any, user: T): T {
    if (err) {
      // Don't return the erorr, could contain secrets.
      // Do log it for future analysis though.
      this.logger.error(err);
      throw new InternalServerErrorException(`Couldn't log in with LDAP`);
    }

    if (err) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
