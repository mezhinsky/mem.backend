import { Module } from '@nestjs/common';
import { TgPublisherService } from './tg-publisher.service';

@Module({
  providers: [TgPublisherService],
  exports: [TgPublisherService],
})
export class TgPublisherModule {}
