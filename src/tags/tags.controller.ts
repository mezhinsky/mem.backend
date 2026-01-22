import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import { TagEntity } from './entities/tag.entity';
import { ArticleEntity } from '../articles/entities/article.entity';
import { GatewayAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('tags')
@ApiTags('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: TagEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOkResponse({ type: TagEntity, isArray: true })
  findAll(@Query() query: QueryTagsDto) {
    return this.tagsService.findAll(query);
  }

  @Get('by-slug/:slug')
  @ApiOkResponse({ type: TagEntity })
  findOneBySlug(@Param('slug') slug: string) {
    return this.tagsService.findOneBySlug(slug);
  }

  @Get(':id')
  @ApiOkResponse({ type: TagEntity })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: TagEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(+id, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: TagEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(+id);
  }

  @Get('by-slug/:slug/articles')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findArticlesByTagSlug(
    @Param('slug') slug: string,
    @Query() query: QueryTagsDto,
  ) {
    return this.tagsService.findArticlesByTagSlug(slug, false, query);
  }

  @Get('by-slug/:slug/articles/public')
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  findPublicArticlesByTagSlug(
    @Param('slug') slug: string,
    @Query() query: QueryTagsDto,
  ) {
    return this.tagsService.findArticlesByTagSlug(slug, true, query);
  }
}
