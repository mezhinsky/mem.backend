import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveFolderDto } from './dto/move-folder.dto';
import { QueryFoldersDto } from './dto/query-folders.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFolderDto) {
    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent folder with id=${dto.parentId} not found`);
      }
    }

    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async findAll(query: QueryFoldersDto) {
    const where = {
      parentId: query.parentId ?? null,
    };

    return this.prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            assets: true,
            children: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            assets: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id=${id} not found`);
    }

    return folder;
  }

  async getPath(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id=${id} not found`);
    }

    // Build path from folder to root
    const path: { id: string; name: string }[] = [];
    let current = folder;

    while (current) {
      path.unshift({ id: current.id, name: current.name });
      if (current.parentId) {
        const parent = await this.prisma.folder.findUnique({
          where: { id: current.parentId },
        });
        current = parent!;
      } else {
        break;
      }
    }

    return path;
  }

  async update(id: string, dto: UpdateFolderDto) {
    const existing = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Folder with id=${id} not found`);
    }

    return this.prisma.folder.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });
  }

  async move(id: string, dto: MoveFolderDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id=${id} not found`);
    }

    const newParentId = dto.parentId ?? null;

    // Can't move to itself
    if (newParentId === id) {
      throw new BadRequestException('Cannot move folder into itself');
    }

    // Validate new parent exists
    if (newParentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: newParentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent folder with id=${newParentId} not found`);
      }

      // Check for circular reference - new parent can't be a descendant
      if (await this.isDescendant(newParentId, id)) {
        throw new BadRequestException('Cannot move folder into its own descendant');
      }
    }

    return this.prisma.folder.update({
      where: { id },
      data: {
        parentId: newParentId,
      },
    });
  }

  async remove(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id=${id} not found`);
    }

    // Cascade delete is handled by Prisma schema
    // Assets will have folderId set to null (SetNull)
    return this.prisma.folder.delete({
      where: { id },
    });
  }

  /**
   * Check if targetId is a descendant of ancestorId
   */
  private async isDescendant(targetId: string, ancestorId: string): Promise<boolean> {
    let currentId: string | null = targetId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }

      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = folder?.parentId ?? null;
    }

    return false;
  }
}
