import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, QueryUsersDto, UserResponseDto } from './dto';
import { Role, Prisma } from '../../generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto): Promise<{
    users: UserResponseDto[];
    total: number;
  }> {
    const { search, role, isActive, skip = 0, take = 20 } = query;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => new UserResponseDto(user)),
      total,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserResponseDto(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent removing the last admin
    if (
      existingUser.role === Role.ADMIN &&
      (updateUserDto.role === Role.USER || updateUserDto.isActive === false)
    ) {
      await this.ensureNotLastAdmin(id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new UserResponseDto(user);
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent deactivating the last admin
    if (existingUser.role === Role.ADMIN) {
      await this.ensureNotLastAdmin(id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new UserResponseDto(user);
  }

  private async ensureNotLastAdmin(userId: string): Promise<void> {
    const activeAdminCount = await this.prisma.user.count({
      where: {
        role: Role.ADMIN,
        isActive: true,
        id: { not: userId },
      },
    });

    if (activeAdminCount === 0) {
      throw new BadRequestException(
        'Cannot remove or disable the last active admin user',
      );
    }
  }
}
