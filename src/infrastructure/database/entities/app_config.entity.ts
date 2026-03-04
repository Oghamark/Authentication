import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('app_config')
export class AppConfigEntity {
  @PrimaryColumn()
  id: number;

  @Column({ default: true, nullable: false })
  signupEnabled: boolean;
}
