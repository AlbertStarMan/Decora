//src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from './core/core.module';
import { FinanceModule } from './finance/finance.module';
import { CryptoModule } from './crypto/crypto.module';
import { User } from './core/entities/user.entity';
import { Host } from './core/entities/host.entity';


@Module({
  imports: [
    // Регистрируем сущности для Core Module
    TypeOrmModule.forFeature([User, Host]),
    // Настройка подключения к PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',      // или имя вашего Docker-контейнера
      port: 5432,
      username: 'decora_user', // замените на вашего пользователя
      password: 'password',     // замените на ваш пароль
      database: 'decora_db',   // замените на вашу базу
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Сканируем все Entity
      synchronize: true,      // !!! ВНИМАНИЕ: Использовать только для разработки. 
                               // В продакшене используйте миграции.
    }),
    CoreModule,
    FinanceModule,
    CryptoModule,
  ],
})
export class AppModule {}