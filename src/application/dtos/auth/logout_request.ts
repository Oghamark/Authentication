import { IsBoolean, IsString } from 'class-validator';

export class LogoutRequest {
  @IsString()
  userId: string;

  @IsString()
  refreshToken?: string;

  @IsBoolean()
  logoutAll?: boolean;
}
