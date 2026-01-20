import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tag } from '../../../generated/prisma';

export class TagEntity implements Tag {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ description: 'Cover image asset ID' })
  coverAssetId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
