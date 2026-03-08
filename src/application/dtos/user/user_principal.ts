import { User } from 'src/domain/entities/user.entity';

export interface UserPrincipal {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function toUserPrincipal(user: User): UserPrincipal {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
