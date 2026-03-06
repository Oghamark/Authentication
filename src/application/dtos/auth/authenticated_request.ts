import { UserResponse } from 'src/application/dtos/user/user_response';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: UserResponse;
}
