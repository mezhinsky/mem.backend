// src/articles/entities/article.entity.ts

import { Article } from 'generated/prisma';
import { ApiProperty } from '@nestjs/swagger';
import { TagEntity } from '../../tags/entities/tag.entity';

export class ArticleEntity implements Article {
  @ApiProperty()
  id: number;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  slug: string | null;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  content: any;

  @ApiProperty({ required: false, nullable: true })
  thumbnailAssetId: string | null;

  @ApiProperty({ required: false, nullable: true })
  ogImageAssetId: string | null;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [TagEntity], required: false })
  tags?: TagEntity[];
}
