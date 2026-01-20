import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PublicArticlesController } from './public-articles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TgPublisherModule } from '../tg-publisher/tg-publisher.module';

@Module({
  controllers: [ArticlesController, PublicArticlesController],
  providers: [ArticlesService],
  imports: [PrismaModule, TgPublisherModule],
})
export class ArticlesModule {}
