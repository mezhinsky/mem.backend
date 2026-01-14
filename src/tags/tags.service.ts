import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  create(createTagDto: CreateTagDto) {
    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  async findAll(query: QueryTagsDto) {
    const { search } = query;
    const where: Prisma.TagWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!tag) {
      throw new NotFoundException(`Тег с id=${id} не найден`);
    }
    return tag;
  }

  async findOneBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
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

  async findArticlesByTagSlug(slug: string, publishedOnly = false) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });
    if (!tag) {
      throw new NotFoundException(`Тег со slug="${slug}" не найден`);
    }

    const where: Prisma.ArticleWhereInput = {
      tags: { some: { slug } },
    };

    if (publishedOnly) {
      where.published = true;
    }

    return this.prisma.article.findMany({
      where,
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
