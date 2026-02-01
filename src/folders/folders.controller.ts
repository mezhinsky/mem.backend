import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveFolderDto } from './dto/move-folder.dto';
import { QueryFoldersDto } from './dto/query-folders.dto';
import { FolderEntity, FolderPathItem, FolderWithChildrenEntity } from './entities/folder.entity';
import { GatewayAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('folders')
@ApiTags('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: FolderEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  create(@Body() dto: CreateFolderDto) {
    return this.foldersService.create(dto);
  }

  @Get()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderWithChildrenEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findAll(@Query() query: QueryFoldersDto) {
    return this.foldersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderWithChildrenEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Get(':id/path')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderPathItem, isArray: true })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  getPath(@Param('id') id: string) {
    return this.foldersService.getPath(id);
  }

  @Patch(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  update(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    return this.foldersService.update(id, dto);
  }

  @Patch(':id/move')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  move(@Param('id') id: string, @Body() dto: MoveFolderDto) {
    return this.foldersService.move(id, dto);
  }

  @Delete(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
