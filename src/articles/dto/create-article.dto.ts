import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false, default: false })
  published?: boolean = false;
}
