// src/core/router/router.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Host } from '../entities/host.entity';

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);
  private http: AxiosInstance; // Экземпляр Axios

  constructor() {
    this.http = axios.create({
      timeout: 5000, // Таймаут 5 секунд для внешней коммуникации
    });
  }

  // Метод для отправки сообщения на внешний хост
  async routeMessageToHost(
    recipientHost: Host,
    messagePayload: any,
  ): Promise<boolean> {
    const targetUrl = `http://${recipientHost.ipAddress}:4000/api/message`; // Предполагаем, что хосты слушают на порту 4000

    this.logger.log(`Attempting to route message to Host: ${recipientHost.hostName} at ${targetUrl}`);

    try {
      // Отправляем POST-запрос с данными сообщения
      const response = await this.http.post(targetUrl, messagePayload, {
        // Здесь можно добавить заголовки для аутентификации между хостами
      });

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`Message successfully routed to ${recipientHost.hostName}`);
        return true;
      }
      
      this.logger.error(`Host ${recipientHost.hostName} returned status: ${response.status}`);
      return false;
      
    } catch (error) {
      this.logger.error(
        `Failed to route message to ${recipientHost.hostName}: ${error.message}`,
      );
      // Здесь можно добавить логику повторной попытки или оповещения о недоступности
      return false;
    }
  }
}
