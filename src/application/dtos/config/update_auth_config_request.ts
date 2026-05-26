import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAuthConfigRequest {
  @IsBoolean()
  @IsOptional()
  signupEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  oidcEnabled?: boolean;

  @IsString()
  @IsOptional()
  oidcIssuerUrl?: string | null;

  @IsString()
  @IsOptional()
  oidcClientId?: string | null;

  @IsString()
  @IsOptional()
  oidcClientSecret?: string | null;

  @IsString()
  @IsOptional()
  oidcCallbackUrl?: string | null;

  @IsString()
  @IsOptional()
  oidcProviderName?: string | null;

  @IsBoolean()
  @IsOptional()
  ldapEnabled?: boolean;

  @IsString()
  @IsOptional()
  ldapServerUrl?: string | null;

  @IsString()
  @IsOptional()
  ldapBindDn?: string | null;

  @IsString()
  @IsOptional()
  ldapBindPassword?: string | null;

  @IsString()
  @IsOptional()
  ldapBaseDn?: string | null;

  @IsString()
  @IsOptional()
  ldapUserGroup?: string | null;
}
