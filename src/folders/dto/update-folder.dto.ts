import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFolderDto {
  @ApiPropertyOptional({ description: 'New folder name' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;
}
