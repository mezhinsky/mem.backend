import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryArticlesDto } from './dto/query-articles.dto';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  private readonly articleInclude = {
    thumbnailAsset: {
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
        metadata: true,
      },
    },
    ogImageAsset: {
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
        metadata: true,
      },
    },
    tags: true,
  } as const;

  create(createArticleDto: CreateArticleDto) {
    const { tagIds, ...articleData } = createArticleDto;

    return this.prisma.article.create({
      data: {
        ...articleData,
        ...(tagIds && {
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        }),
      },
      include: this.articleInclude,
    });
  }

  findDrafts() {
    return this.prisma.article.findMany({
      where: { published: false },
      include: this.articleInclude,
    });
  }

  private buildWhere(
    query: QueryArticlesDto,
    opts: { publishedOnly?: boolean } = {},
  ): Prisma.ArticleWhereInput {
    const { search } = query;
    const where: Prisma.ArticleWhereInput = {};

    if (opts.publishedOnly) {
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findAll(query: QueryArticlesDto) {
    const { page, limit, sortBy, order, search, cursorId } = query;

    const where = this.buildWhere(query);

    const orderBy = {
      [sortBy ?? 'createdAt']: order ?? 'desc',
    } as Record<string, 'asc' | 'desc'>;

    // ⚡ Универсальная пагинация
    const take = limit;
    let skip: number | undefined;
    let cursor: Prisma.ArticleWhereUniqueInput | undefined;

    if (cursorId) {
      // Cursor-based pagination
      cursor = { id: cursorId };
      skip = 1; // пропустить сам курсор
    } else {
      // Offset-based pagination
      skip = (page - 1) * limit;
    }

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        take,
        skip,
        ...(cursor ? { cursor } : {}),
        include: this.articleInclude,
      }),
      this.prisma.article.count({ where }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;

    return {
      items,
      total,
      limit,
      page: cursorId ? undefined : page,
      totalPages: cursorId ? undefined : Math.ceil(total / limit),
      nextCursor, // 👈 для "Load more" в React
    };
  }

  async findAllPublic(query: QueryArticlesDto) {
    const { page, limit, sortBy, order, cursorId } = query;

    const where = this.buildWhere(query, { publishedOnly: true });

    const orderBy = {
      [sortBy ?? 'createdAt']: order ?? 'desc',
    } as Record<string, 'asc' | 'desc'>;

    const take = limit;
    let skip: number | undefined;
    let cursor: Prisma.ArticleWhereUniqueInput | undefined;

    if (cursorId) {
      cursor = { id: cursorId };
      skip = 1;
    } else {
      skip = (page - 1) * limit;
    }

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        take,
        skip,
        ...(cursor ? { cursor } : {}),
        include: this.articleInclude,
      }),
      this.prisma.article.count({ where }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;

    return {
      items,
      total,
      limit,
      page: cursorId ? undefined : page,
      totalPages: cursorId ? undefined : Math.ceil(total / limit),
      nextCursor,
    };
  }

  async findOne(id: number) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      include: this.articleInclude,
    });
    if (!existing) {
      throw new NotFoundException(`Статья с id=${id} не найдена`);
    }

    return existing;
  }

  async findOneBySlug(slug: string) {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
      include: this.articleInclude,
    });
    if (!existing) {
      throw new NotFoundException(`Статья со slug="${slug}" не найдена`);
    }

    return existing;
  }

  async findOnePublicBySlugOrId(slugOrId: string) {
    const parsedId = Number(slugOrId);
    const isNumericId =
      Number.isInteger(parsedId) && String(parsedId) === slugOrId;

    const existing = await this.prisma.article.findFirst({
      where: isNumericId
        ? { id: parsedId, published: true }
        : { slug: slugOrId, published: true },
      include: this.articleInclude,
    });

    if (!existing) {
      throw new NotFoundException(
        `Опубликованная статья "${slugOrId}" не найдена`,
      );
    }

    return existing;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      include: this.articleInclude,
    });
    if (!existing) {
      throw new NotFoundException(`Статья с id=${id} не найдена`);
    }

    const { tagIds, ...articleData } = updateArticleDto;

    return this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        ...(tagIds !== undefined && {
          tags: {
            set: tagIds.map((tagId) => ({ id: tagId })),
          },
        }),
      },
      include: this.articleInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Статья с id=${id} не найдена`);
    }
    return this.prisma.article.delete({
      where: { id },
    });
  }
}
