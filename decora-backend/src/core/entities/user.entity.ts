//src/core/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Host } from './host.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Уникальный ID пользователя

  @Column({ unique: true, length: 50 })
  username: string; // Имя пользователя в Decora

  @Column({ default: true })
  isActive: boolean; // Статус активности

  // Связь с Хостом
  @ManyToOne(() => Host, host => host.users, { nullable: true })
  localHost: Host;

  @Column({ nullable: true })
  currentSocketId: string; // ID активного WebSocket-подключения
}