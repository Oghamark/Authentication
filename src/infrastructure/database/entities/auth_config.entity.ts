import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auth_config')
export class AuthConfigEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'signup_enabled', default: true })
  signupEnabled: boolean;

  @Column({ name: 'oidc_enabled', default: false })
  oidcEnabled: boolean;

  @Column({ name: 'oidc_issuer_url', type: 'text', nullable: true })
  oidcIssuerUrl: string | null;

  @Column({ name: 'oidc_client_id', type: 'text', nullable: true })
  oidcClientId: string | null;

  @Column({ name: 'oidc_client_secret', type: 'text', nullable: true })
  oidcClientSecret: string | null;

  @Column({ name: 'oidc_callback_url', type: 'text', nullable: true })
  oidcCallbackUrl: string | null;

  @Column({ name: 'oidc_provider_name', type: 'text', nullable: true })
  oidcProviderName: string | null;
}
