import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalGuard implements CanActivate {
  private readonly internalSecret: string;

  constructor(private configService: ConfigService) {
    this.internalSecret = this.configService.getOrThrow<string>(
      'INTERNAL_SERVICE_SECRET',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-internal-secret'] as string;

    if (!secret || secret !== this.internalSecret) {
      throw new UnauthorizedException('Invalid internal service secret');
    }

    return true;
  }
}
