import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService],
  imports: [PrismaModule],
  exports: [FoldersService],
})
export class FoldersModule {}
