import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  imports: [PrismaModule, AuthModule],
  exports: [TagsService],
})
export class TagsModule {}
