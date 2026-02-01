import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MoveFolderDto {
  @ApiPropertyOptional({ description: 'New parent folder ID (null for root)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
