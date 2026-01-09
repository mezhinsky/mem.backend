// src/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export type UploadPublicFileResult = {
  key: string;
  url: string;
};

export type PutPublicObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
};

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket = process.env.S3_BUCKET!;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true, // для MinIO/Timeweb обычно нужно
    });
  }

  getPublicUrlForKey(key: string): string {
    const baseUrl = process.env.S3_PUBLIC_BASE_URL!;
    return `${baseUrl}/${key}`;
  }

  async putPublicObject(params: PutPublicObjectParams): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        ACL: 'public-read',
      }),
    );
  }

  async uploadPublicFile(
    file: Express.Multer.File,
    opts: { prefix: string },
  ): Promise<UploadPublicFileResult> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `${opts.prefix}/${randomUUID()}.${ext}`;

    await this.putPublicObject({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    return { key, url: this.getPublicUrlForKey(key) };
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const { url } = await this.uploadPublicFile(file, {
      prefix: 'articles/images',
    });
    return url;
  }
}
