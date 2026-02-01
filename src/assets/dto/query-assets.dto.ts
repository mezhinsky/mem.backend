import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryAssetsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'originalName', 'size'])
  sortBy?: 'createdAt' | 'updatedAt' | 'originalName' | 'size';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cursorId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'null' ? null : value))
  @IsUUID(undefined, { message: 'folderId must be a valid UUID or "null"' })
  folderId?: string | null;
}
