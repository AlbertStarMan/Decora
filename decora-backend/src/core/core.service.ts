//src/core/core.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Host } from './entities/host.entity';

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Host)
    private hostsRepository: Repository<Host>,
  ) {}

  // 1. Поиск или создание Хоста
  async findOrCreateHost(hostName: string, ipAddress: string): Promise<Host> {
    let host = await this.hostsRepository.findOne({ where: { hostName } });
    if (!host) {
      host = this.hostsRepository.create({ hostName, ipAddress });
      await this.hostsRepository.save(host);
      this.logger.log(`New Host created: ${hostName} at ${ipAddress}`);
    }
    return host;
  }

  // 2. Регистрация нового Пользователя и привязка к Хосту
  async registerUser(username: string, hostId: string): Promise<User> {
    const host = await this.hostsRepository.findOne({ where: { id: hostId } });
    if (!host) {
      throw new Error('Host not found');
    }

    const newUser = this.usersRepository.create({ username, localHost: host });
    const user = await this.usersRepository.save(newUser);

    // Увеличиваем счетчик пользователей на хосте
    host.usersCount += 1;
    await this.hostsRepository.save(host);

    this.logger.log(`User ${username} registered and attached to Host ${host.hostName}`);
    return user;
  }

  // 3. Обновление Socket ID пользователя
  async updateUserSocketId(userId: string, socketId: string): Promise<void> {
    await this.usersRepository.update(userId, { currentSocketId: socketId, isActive: true });
  }

  // 4. Получение Хоста по Пользователю
  async getHostByUsername(username: string): Promise<Host|null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['localHost'], // Загружаем информацию о привязанном хосте
    });
    return user ? user.localHost : null;
  }
}