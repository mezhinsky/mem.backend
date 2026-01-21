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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { AssetEntity } from './entities/asset.entity';
import { QueryAssetsDto } from './dto/query-assets.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { GatewayAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('assets')
@ApiTags('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AssetEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    return this.assetsService.create(file);
  }

  @Post('images')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AssetEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  @UseInterceptors(FileInterceptor('file'))
  async createImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    return this.assetsService.createImage(file);
  }

  @Get()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AssetEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findAll(@Query() query: QueryAssetsDto) {
    return this.assetsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AssetEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AssetEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AssetEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
