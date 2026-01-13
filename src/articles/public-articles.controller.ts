import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { ArticleEntity } from './entities/article.entity';

@Controller('public/articles')
@ApiTags('public-articles')
export class PublicArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'List published articles (public)' })
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  findAll(@Query() query: QueryArticlesDto) {
    return this.articlesService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published article by slug (public)' })
  @ApiOkResponse({ type: ArticleEntity })
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOnePublicBySlugOrId(slug);
  }
}

