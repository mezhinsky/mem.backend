import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '../../../generated/prisma';

export class QueryUsersDto {
  @ApiPropertyOptional({
    description: 'Search by email or name',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of records to take',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  take?: number = 20;
}
