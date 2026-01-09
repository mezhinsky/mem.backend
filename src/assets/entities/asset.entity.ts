import { ApiProperty } from '@nestjs/swagger';
import { Asset, AssetType } from 'generated/prisma';

export class AssetEntity implements Asset {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AssetType })
  type: AssetType;

  @ApiProperty()
  bucket: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty({ required: false, nullable: true })
  metadata: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
