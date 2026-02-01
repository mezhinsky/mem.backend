import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { QueryAssetsDto } from './dto/query-assets.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { BulkMoveAssetsDto } from './dto/bulk-move-assets.dto';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  private tryKeyFromUrl(url: string): string | null {
    const baseUrl = process.env.S3_PUBLIC_BASE_URL;
    if (!baseUrl) return null;
    const prefix = `${baseUrl}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length);
  }

  async create(file: Express.Multer.File) {
    if (file.mimetype?.startsWith('image/')) {
      return this.createImage(file);
    }
    return this.createFile(file);
  }

  async createFile(file: Express.Multer.File) {
    const assetId = randomUUID();
    const prefix = `assets/files/${assetId}`;
    const ext = file.originalname.split('.').pop() || 'bin';
    const originalKey = `${prefix}/original.${ext}`;

    await this.uploadService.putPublicObject({
      key: originalKey,
      body: file.buffer,
      contentType: file.mimetype || 'application/octet-stream',
    });

    const url = this.uploadService.getPublicUrlForKey(originalKey);

    return this.prisma.asset.create({
      data: {
        id: assetId,
        type: 'FILE',
        bucket: process.env.S3_BUCKET!,
        key: originalKey,
        url,
        originalName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size,
      },
    });
  }

  async createImage(file: Express.Multer.File) {
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Можно загружать только изображения');
    }

    const assetId = randomUUID();
    const prefix = `assets/images/${assetId}`;

    const inputImage = sharp(file.buffer, { failOn: 'none' });
    const inputMeta = await inputImage.metadata();

    const [thumbBuffer, mdBuffer, lgBuffer, ogBuffer] = await Promise.all([
      inputImage
        .clone()
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer(),
      inputImage
        .clone()
        .resize({ width: 768, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 82 })
        .toBuffer(),
      inputImage
        .clone()
        .resize({ width: 1600, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 82 })
        .toBuffer(),
      inputImage
        .clone()
        .resize(1200, 630, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toBuffer(),
    ]);

    const originalExt = file.originalname.split('.').pop() || 'bin';
    const originalKey = `${prefix}/original.${originalExt}`;
    const thumbKey = `${prefix}/thumb.webp`;
    const mdKey = `${prefix}/md.webp`;
    const lgKey = `${prefix}/lg.webp`;
    const ogKey = `${prefix}/og.webp`;

    await Promise.all([
      this.uploadService.putPublicObject({
        key: originalKey,
        body: file.buffer,
        contentType: file.mimetype,
      }),
      this.uploadService.putPublicObject({
        key: thumbKey,
        body: thumbBuffer,
        contentType: 'image/webp',
      }),
      this.uploadService.putPublicObject({
        key: mdKey,
        body: mdBuffer,
        contentType: 'image/webp',
      }),
      this.uploadService.putPublicObject({
        key: lgKey,
        body: lgBuffer,
        contentType: 'image/webp',
      }),
      this.uploadService.putPublicObject({
        key: ogKey,
        body: ogBuffer,
        contentType: 'image/webp',
      }),
    ]);

    const url = this.uploadService.getPublicUrlForKey(originalKey);
    const variants = {
      thumb: this.uploadService.getPublicUrlForKey(thumbKey),
      md: this.uploadService.getPublicUrlForKey(mdKey),
      lg: this.uploadService.getPublicUrlForKey(lgKey),
      og: this.uploadService.getPublicUrlForKey(ogKey),
      original: url,
    };

    return this.prisma.asset.create({
      data: {
        id: assetId,
        type: 'IMAGE',
        bucket: process.env.S3_BUCKET!,
        key: originalKey,
        url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        metadata: {
          variants,
          width: inputMeta.width ?? null,
          height: inputMeta.height ?? null,
          format: inputMeta.format ?? null,
        },
      },
    });
  }

  async findAll(query: QueryAssetsDto) {
    const { page, limit, sortBy, order, search, cursorId, folderId } = query;

    const where: any = {};

    // Filter by folder - only apply if folderId is explicitly provided
    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { mimeType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      [sortBy ?? 'createdAt']: order ?? 'desc',
    } as Record<string, 'asc' | 'desc'>;

    const take = limit;
    let skip: number | undefined;
    let cursor: any;

    if (cursorId) {
      cursor = { id: cursorId };
      skip = 1;
    } else {
      skip = (page - 1) * limit;
    }

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy,
        take,
        skip,
        ...(cursor ? { cursor } : {}),
      }),
      this.prisma.asset.count({ where }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;

    return {
      items,
      total,
      limit,
      page: cursorId ? undefined : page,
      totalPages: cursorId ? undefined : Math.ceil(total / limit),
      nextCursor,
    };
  }

  async findOne(id: string) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Asset с id=${id} не найден`);
    }
    return existing;
  }

  async update(id: string, dto: UpdateAssetDto) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Asset с id=${id} не найден`);
    }

    const data: any = {};
    if (dto.originalName !== undefined) data.originalName = dto.originalName;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;
    if (dto.folderId !== undefined) {
      // Validate folder exists if not null
      if (dto.folderId !== null) {
        const folder = await this.prisma.folder.findUnique({
          where: { id: dto.folderId },
        });
        if (!folder) {
          throw new NotFoundException(`Folder с id=${dto.folderId} не найден`);
        }
      }
      data.folderId = dto.folderId;
    }

    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  async bulkMove(dto: BulkMoveAssetsDto) {
    const { assetIds, folderId } = dto;

    // Validate folder exists if provided
    if (folderId !== null && folderId !== undefined) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        throw new NotFoundException(`Folder с id=${folderId} не найден`);
      }
    }

    // Validate all assets exist
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true },
    });

    if (assets.length !== assetIds.length) {
      const foundIds = new Set(assets.map((a) => a.id));
      const missingIds = assetIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Assets not found: ${missingIds.join(', ')}`);
    }

    // Update all assets
    await this.prisma.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { folderId: folderId ?? null },
    });

    return { count: assetIds.length };
  }

  async remove(id: string) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Asset с id=${id} не найден`);
    }

    const keysToDelete = new Set<string>();
    keysToDelete.add(existing.key);

    const variants = (existing as any).metadata?.variants;
    if (variants && typeof variants === 'object') {
      for (const value of Object.values(variants)) {
        if (typeof value !== 'string') continue;
        const key = this.tryKeyFromUrl(value);
        if (key) keysToDelete.add(key);
      }
    }

    const dir = existing.key.split('/').slice(0, -1).join('/');
    if (existing.type === 'IMAGE' && dir) {
      keysToDelete.add(`${dir}/thumb.webp`);
      keysToDelete.add(`${dir}/md.webp`);
      keysToDelete.add(`${dir}/lg.webp`);
      keysToDelete.add(`${dir}/og.webp`);
    }

    await this.uploadService.deletePublicObjects([...keysToDelete]);

    return this.prisma.asset.delete({ where: { id } });
  }
}
