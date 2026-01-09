import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

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

  async findOne(id: string) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Asset с id=${id} не найден`);
    }
    return existing;
  }
}
