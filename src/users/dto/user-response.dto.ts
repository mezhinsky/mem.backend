import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  name: string | null;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar: string | null;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
