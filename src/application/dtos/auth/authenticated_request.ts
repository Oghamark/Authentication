import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: UserPrincipal;
}
