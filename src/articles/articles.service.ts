import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryArticlesDto } from './dto/query-articles.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({ data: createArticleDto });
  }

  findDrafts() {
    return this.prisma.article.findMany({ where: { published: false } });
  }

  async findAll(query: QueryArticlesDto) {
    const { page, limit, sortBy, order, search, cursorId } = query;

    const where: any = {
      // published: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      [sortBy ?? 'createdAt']: order ?? 'desc',
    } as Record<string, 'asc' | 'desc'>;

    // ⚡ Универсальная пагинация
    const take = limit;
    let skip: number | undefined;
    let cursor: any;

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

  async findOne(id: number) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Статья с id=${id} не найдена`);
    }

    return this.prisma.article.findUnique({ where: { id } });
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Статья с id=${id} не найдена`);
    }

    return this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
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
