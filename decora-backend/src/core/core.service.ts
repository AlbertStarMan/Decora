// src/core/core.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Host } from './entities/host.entity';
import { HttpService } from '@nestjs/axios'; // <--- НОВОЕ: Импортируем HttpService
import { firstValueFrom } from 'rxjs'; // <--- НОВОЕ: Для работы с RxJS

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Host)
    private hostsRepository: Repository<Host>,
    private readonly httpService: HttpService, // <--- НОВОЕ: Инжектируем HttpService
  ) {}

  // 1. Поиск или создание Хоста (КОД БЕЗ ИЗМЕНЕНИЙ)
  async findOrCreateHost(hostName: string, ipAddress: string): Promise<Host> {
    let host = await this.hostsRepository.findOne({ where: { hostName } });
    if (!host) {
      host = this.hostsRepository.create({ hostName, ipAddress });
      await this.hostsRepository.save(host);
      this.logger.log(`New Host created: ${hostName} at ${ipAddress}`);
    }
    return host;
  }

  // 2. Регистрация нового Пользователя и привязка к Хосту (КОД БЕЗ ИЗМЕНЕНИЙ)
  async registerUser(username: string, hostId: string): Promise<User> {
    const host = await this.hostsRepository.findOne({ where: { id: hostId } });
    if (!host) {
      throw new Error('Host not found');
    }

    const newUser = this.usersRepository.create({ username, localHost: host });
    const user = await this.usersRepository.save(newUser);

    host.usersCount += 1;
    await this.hostsRepository.save(host);

    this.logger.log(`User ${username} registered and attached to Host ${host.hostName}`);
    return user;
  }

  // 3. Обновление Socket ID пользователя (КОД БЕЗ ИЗМЕНЕНИЙ)
  async updateUserSocketId(userId: string, socketId: string): Promise<void> {
    await this.usersRepository.update(userId, { currentSocketId: socketId, isActive: true });
  }

  // 4. Получение Хоста по Пользователю (КОД БЕЗ ИЗМЕНЕНИЙ)
  async getHostByUsername(username: string): Promise<Host | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['localHost'],
    });
    return user?.localHost ?? null;
  }

  // 5. НОВЫЙ МЕТОД: Метод для пересылки сообщения на другой Хост
  async routeMessageToHost(
      recipientHost: Host, 
      payload: { sender: string, recipient: string, message: string }
  ): Promise<boolean> {
      const hostUrl = `http://${recipientHost.ipAddress}:3001/message-in`; 
      
      this.logger.log(`Attempting to route message to ${recipientHost.hostName} at ${hostUrl}`);

      try {
          const response = await firstValueFrom(
              this.httpService.post(hostUrl, payload)
          );

          if (response.status === 200 || response.status === 201) {
              this.logger.log(`Message successfully routed to Host: ${recipientHost.hostName}`);
              return true;
          }
          return false;
          
      } catch (error) {
          this.logger.error(`Failed to route message to Host ${recipientHost.hostName}: ${error.message}`);
          return false;
      }
  }
}