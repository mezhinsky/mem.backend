import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../../../generated/prisma';

export class TagEntity implements Tag {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
