import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleRequest {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  authenticatedUserId: string;

  @IsString({ message: 'Role must be a string' })
  @IsIn(['ADMIN', 'USER'], { message: 'Role must be ADMIN or USER' })
  role: string;
}
