import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ArticleEntity } from './entities/article.entity';
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
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { GatewayAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('articles')
@ApiTags('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ArticleEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get('drafts')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  findDrafts() {
    return this.articlesService.findDrafts();
  }

  @Get()
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  findAll(@Query() query: QueryArticlesDto) {
    return this.articlesService.findAll(query);
  }

  @Get('by-slug/:slug')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity })
  findOneBySlug(@Param('slug') slug: string) {
    return this.articlesService.findOneBySlug(slug);
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleEntity })
  @ApiForbiddenResponse({ description: 'Access denied - Admin role required' })
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
