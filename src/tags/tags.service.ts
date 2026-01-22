import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private readonly tagInclude = {
    coverAsset: {
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
        metadata: true,
      },
    },
  } as const;

  create(createTagDto: CreateTagDto) {
    return this.prisma.tag.create({
      data: createTagDto,
      include: this.tagInclude,
    });
  }

  async findAll(query: QueryTagsDto) {
    const { page, limit, sortBy, order, search } = query;

    const where: Prisma.TagWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      [sortBy ?? 'name']: order ?? 'asc',
    } as Record<string, 'asc' | 'desc'>;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: this.tagInclude,
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: this.tagInclude,
    });
    if (!tag) {
      throw new NotFoundException(`Тег с id=${id} не найден`);
    }
    return tag;
  }

  async findOneBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: this.tagInclude,
    });
    if (!tag) {
      throw new NotFoundException(`Тег со slug="${slug}" не найден`);
    }
    return tag;
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Тег с id=${id} не найден`);
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
      include: this.tagInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Тег с id=${id} не найден`);
    }

    return this.prisma.tag.delete({
      where: { id },
    });
  }

  async findArticlesByTagSlug(
    slug: string,
    publishedOnly = false,
    query: QueryTagsDto = { page: 1, limit: 10 },
  ) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });
    if (!tag) {
      throw new NotFoundException(`Тег со slug="${slug}" не найден`);
    }

    const { page = 1, limit = 10, cursorId } = query;

    const where: Prisma.ArticleWhereInput = {
      tags: { some: { slug } },
    };

    if (publishedOnly) {
      where.published = true;
    }

    const take = limit;
    let skip: number | undefined;
    let cursor: Prisma.ArticleWhereUniqueInput | undefined;

    if (cursorId) {
      cursor = { id: cursorId };
      skip = 1;
    } else {
      skip = (page - 1) * limit;
    }

    const articleInclude = {
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
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        ...(cursor ? { cursor } : {}),
        include: articleInclude,
      }),
      this.prisma.article.count({ where }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = items.length === limit ? lastItem?.id : null;

    return {
      items,
      total,
      limit,
      page: cursorId ? undefined : page,
      totalPages: cursorId ? undefined : Math.ceil(total / limit),
      nextCursor,
    };
  }
}
