// src/core/core.gateway.ts

import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { CoreService } from './core.service';
import { Server, Socket } from 'socket.io'; 

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CoreGateway {
  // CoreService уже инжектирован
  constructor(private readonly coreService: CoreService) {} 

  @WebSocketServer()
  server: Server; 

  // handleConnection, handleDisconnect (КОД БЕЗ ИЗМЕНЕНИЙ)

  // Обработчик для события 'registerUserSocket' (КОД БЕЗ ИЗМЕНЕНИЙ)
  @SubscribeMessage('registerUserSocket')
  async handleRegister(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket): Promise<void> {
    try {
        await this.coreService.updateUserSocketId(data.userId, client.id);
        console.log(`User ${data.userId} connected and updated with socket ID: ${client.id}`);
        client.emit('registered', { success: true });
    } catch (error) {
        client.emit('error', 'Failed to register socket ID.');
        console.error('Registration error:', error);
    }
  }
  
  // НОВАЯ ЛОГИКА: Маршрутизация сообщения
  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: { senderUsername: string, recipientUsername: string, message: string }, @ConnectedSocket() client: Socket): Promise<void> {
    const { senderUsername, recipientUsername, message } = data;

    // 1. Находим Хост получателя
    const recipientHost = await this.coreService.getHostByUsername(recipientUsername);

    if (!recipientHost) {
        client.emit('error', `Recipient ${recipientUsername} not found or inactive.`);
        return;
    }

    // 2. Маршрутизируем сообщение на Локальный Хост через HTTP
    const isRouted = await this.coreService.routeMessageToHost(recipientHost, {
        sender: senderUsername,
        recipient: recipientUsername,
        message: message,
    });

    // 3. Отправляем подтверждение отправителю
    if (isRouted) {
        client.emit('messageStatus', { 
            status: 'queued', 
            recipient: recipientUsername, 
            routedVia: recipientHost.hostName 
        });
    } else {
        client.emit('messageStatus', { 
            status: 'failed', 
            recipient: recipientUsername, 
            error: 'Host unreachable or internal error.' 
        });
    }
  }
}