import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletController } from './wallet.controller';
import { LedgerService } from '../../../services/ledger/ledger.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WalletController],
  providers: [LedgerService],
})
export class WalletModule {}
