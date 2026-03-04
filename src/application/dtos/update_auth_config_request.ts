import { IsBoolean } from 'class-validator';

export class UpdateAuthConfigRequest {
  @IsBoolean()
  signupEnabled: boolean;
}
