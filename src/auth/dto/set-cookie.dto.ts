import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCookieDto {
  @ApiProperty({ description: 'Session ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Refresh token to store in cookie' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
