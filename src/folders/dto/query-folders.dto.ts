import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryFoldersDto {
  @ApiPropertyOptional({ description: 'Parent folder ID (omit for root folders)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
