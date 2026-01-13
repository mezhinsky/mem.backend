import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PublicArticlesController } from './public-articles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ArticlesController, PublicArticlesController],
  providers: [ArticlesService],
  imports: [PrismaModule, AuthModule],
})
export class ArticlesModule {}
