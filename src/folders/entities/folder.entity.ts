import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FolderEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  parentId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FolderWithChildrenEntity extends FolderEntity {
  @ApiProperty({ type: () => FolderEntity, isArray: true })
  children: FolderEntity[];

  @ApiProperty()
  _count: {
    assets: number;
    children: number;
  };
}

export class FolderPathItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
