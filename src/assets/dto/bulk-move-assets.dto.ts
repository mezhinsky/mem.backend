import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkMoveAssetsDto {
  @ApiProperty({
    description: 'Array of asset IDs to move',
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  assetIds: string[];

  @ApiPropertyOptional({
    description: 'Target folder ID (null for root)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === 'null' || value === null ? null : value))
  @IsUUID(undefined, { message: 'folderId must be a valid UUID or null' })
  folderId?: string | null;
}
