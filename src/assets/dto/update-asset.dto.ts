import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}

