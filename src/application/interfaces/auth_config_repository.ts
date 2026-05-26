import { Result } from 'src/core/result';

export interface AuthConfig {
  signupEnabled: boolean;
  oidcEnabled: boolean;
  oidcIssuerUrl: string | null;
  oidcClientId: string | null;
  oidcClientSecret: string | null;
  oidcCallbackUrl: string | null;
  oidcProviderName: string | null;
  ldapEnabled: boolean;
  ldapServerUrl: string | null;
  ldapBindDn: string | null;
  ldapBindPassword: string | null;
  ldapBaseDn: string | null;
}

export interface IAuthConfigRepository {
  get(): Promise<Result<AuthConfig>>;
  update(config: Partial<AuthConfig>): Promise<Result<AuthConfig>>;
}
