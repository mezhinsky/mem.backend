import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Session ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
