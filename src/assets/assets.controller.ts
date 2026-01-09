import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { AssetEntity } from './entities/asset.entity';

@Controller('assets')
@ApiTags('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiCreatedResponse({ type: AssetEntity })
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    return this.assetsService.create(file);
  }

  @Post('images')
  @ApiCreatedResponse({ type: AssetEntity })
  @UseInterceptors(FileInterceptor('file'))
  async createImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    return this.assetsService.createImage(file);
  }

  @Get(':id')
  @ApiOkResponse({ type: AssetEntity })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }
}
