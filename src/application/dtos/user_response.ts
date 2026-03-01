import { User } from 'src/domain/entities/user.entity';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
