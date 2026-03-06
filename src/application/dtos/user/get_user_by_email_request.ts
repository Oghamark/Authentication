import { IsEmail, IsNotEmpty } from 'class-validator';

export class GetUserByEmailRequest {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
