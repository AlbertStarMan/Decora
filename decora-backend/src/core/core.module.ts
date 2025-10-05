// src/core/core.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // <--- НОВОЕ: Импортируем HttpModule
import { CoreService } from './core.service';
import { CoreGateway } from './core.gateway';
import { User } from './entities/user.entity';
import { Host } from './entities/host.entity';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Host]), 
    HttpModule, // <--- НОВОЕ: Регистрируем HttpModule
  ],
  providers: [CoreService, CoreGateway],
  exports: [CoreService],
  controllers: [AuthController],
})
export class CoreModule {}