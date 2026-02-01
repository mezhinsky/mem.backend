import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiPropertyOptional({
    description: 'Arbitrary JSON metadata; e.g. { alt: "..." }',
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Folder ID to move asset to (null for root)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === 'null' || value === null ? null : value))
  @IsUUID(undefined, { message: 'folderId must be a valid UUID or null' })
  folderId?: string | null;
}
