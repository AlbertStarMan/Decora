// src/core/core.gateway.ts
import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  WebSocketServer, 
  ConnectedSocket, 
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { CoreService } from './core.service';
import { Server, Socket } from 'socket.io'; 
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  // Настройки CORS для WebSockets
  cors: {
    origin: '*', // Временно разрешаем все домены (для разработки)
    methods: ['GET', 'POST'],
  },
  // Путь, по которому клиенты будут подключаться (например, ws://localhost:3000/core)
  namespace: 'core', 
})
export class CoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CoreGateway.name);

  constructor(private readonly coreService: CoreService) {}

  @WebSocketServer()
  server: Server; // Объект Socket.io сервера для управления подключениями

  // --- 1. Обработка подключения и отключения ---

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // На этом этапе мы только знаем ID сокета. Пользователь должен отправить 
    // событие 'registerUserSocket' для полной идентификации.
  }

  // При отключении нам нужно найти пользователя по socketId и обновить его статус на 'isActive: false'
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // TODO: Здесь должна быть логика поиска пользователя по client.id
    // и вызова метода CoreService для установки isActive: false.
  }

  // --- 2. Регистрация Пользователя/Сокета ---

  // Событие, которое клиент должен отправить сразу после подключения для идентификации
  @SubscribeMessage('registerUserSocket')
  async handleRegister(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket): Promise<void> {
    try {
        await this.coreService.updateUserSocketId(data.userId, client.id);
        this.logger.log(`User ${data.userId} successfully registered socket ID: ${client.id}`);
        client.emit('registered', { success: true, message: `Welcome to Decora, user ${data.userId}!` });
    } catch (error) {
        client.emit('error', 'Failed to register socket ID. User ID might be invalid.');
        this.logger.error(`Registration error for user ${data.userId}: ${error.message}`);
    }
  }


  // --- 3. Маршрутизация Сообщений ---

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderUsername: string, recipientUsername: string, message: string }, 
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    
    // 1. Находим Хост получателя
    const recipientHost = await this.coreService.getHostByUsername(data.recipientUsername);

    if (!recipientHost) {
        // Отправляем ошибку, если получатель не найден
        client.emit('messageError', { 
            recipient: data.recipientUsername, 
            error: 'Recipient not found or not attached to any host in the network.'
        });
        return;
    }

    // 2. Логика Маршрутизации: 
    // Здесь NestJS выступает в роли Регионального Хоста, который пересылает сообщение
    // на IP-адрес Локального Хоста получателя.
    
    this.logger.log(
      `Routing message from ${data.senderUsername} to ${data.recipientUsername} 
       via Host: ${recipientHost.hostName} (${recipientHost.ipAddress})`
    );

    // TODO: Здесь необходимо реализовать HTTP/TCP-клиент для фактической отправки 
    // сообщения на recipientHost.ipAddress.
    // Например:
    /*
    const deliveryStatus = await this.routerService.sendMessageToHost({ 
      hostAddress: recipientHost.ipAddress,
      payload: { ...data }
    });
    */

    // 3. Отправка подтверждения отправителю (заглушка)
    client.emit('messageSent', { 
        toHost: recipientHost.hostName, 
        status: 'queued_for_delivery' 
    });
  }
}