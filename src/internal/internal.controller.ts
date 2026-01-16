import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InternalGuard } from './internal.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('internal')
@UseGuards(InternalGuard)
export class InternalController {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user by ID for Gateway authentication
   * This endpoint is only accessible by internal services (Gateway)
   */
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
