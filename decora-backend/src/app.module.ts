import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { FinanceModule } from './finance/finance.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [CoreModule, FinanceModule, CryptoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
