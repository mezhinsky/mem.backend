// src/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

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

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `articles/images/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // если бакет публичный
      }),
    );

    const baseUrl = process.env.S3_PUBLIC_BASE_URL!;
    return `${baseUrl}/${key}`;
  }
}
