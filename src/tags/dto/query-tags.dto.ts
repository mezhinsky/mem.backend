import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTagsDto {
  @ApiProperty({ required: false, description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;
}
