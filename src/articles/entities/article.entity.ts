// src/articles/entities/article.entity.ts

import { Article } from 'generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

export class ArticleEntity implements Article {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
