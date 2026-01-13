import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService],
  imports: [PrismaModule, UploadModule],
})
export class AssetsModule {}
