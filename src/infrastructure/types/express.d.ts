import { UserPrincipal } from 'src/application/dtos/user/user_principal';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends UserPrincipal {}
  }
}
