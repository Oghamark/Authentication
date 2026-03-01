import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auth_config')
export class AuthConfigEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'signup_enabled', default: true })
  signupEnabled: boolean;
}
