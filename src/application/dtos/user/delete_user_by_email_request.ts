import { IsEmail, IsNotEmpty } from 'class-validator';

export class DeleteUserByEmailRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
