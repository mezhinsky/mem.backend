import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ArticlesModule } from './articles/articles.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [PrismaModule, ArticlesModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
