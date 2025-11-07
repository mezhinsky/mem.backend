import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({ data: createArticleDto });
  }

  findDrafts() {
    return this.prisma.article.findMany({ where: { published: false } });
  }

  findAll() {
    return this.prisma.article.findMany({ where: { published: true } });
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
