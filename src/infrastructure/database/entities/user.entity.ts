import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_entity')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ default: 'USER' })
  role: string;

  @Column()
  provider: string;
}
