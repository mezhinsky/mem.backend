import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsObject()
  content: string;

  @ApiProperty({
    required: false,
    description: 'Asset.id for article thumbnail',
  })
  @IsOptional()
  @IsString()
  thumbnailAssetId?: string;

  @ApiProperty({ required: false, description: 'Asset.id for OpenGraph image' })
  @IsOptional()
  @IsString()
  ogImageAssetId?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean = false;
}
