// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { GatewayAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('uploads')
@ApiTags('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Returns uploaded image URL' })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
}
