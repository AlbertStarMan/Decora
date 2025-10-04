//src/core/entities/host.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('hosts')
export class Host {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Уникальный ID хоста

  @Column({ unique: true })
  hostName: string; // Имя/метка хоста (например, "LocalHost_Alex")

  @Column()
  ipAddress: string; // Публичный IP-адрес или домен

  @Column({ default: 0 })
  usersCount: number; // Счетчик привязанных пользователей

  @Column({ default: 'local' })
  type: 'local' | 'regional'; // Тип хоста

  // Связь с Пользователями
  @OneToMany(() => User, user => user.localHost)
  users: User[];
}