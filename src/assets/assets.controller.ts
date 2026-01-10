import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { AssetEntity } from './entities/asset.entity';
import { QueryAssetsDto } from './dto/query-assets.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

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

  @Get()
  @ApiOkResponse({ type: AssetEntity, isArray: true })
  findAll(@Query() query: QueryAssetsDto) {
    return this.assetsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: AssetEntity })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AssetEntity })
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: AssetEntity })
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
