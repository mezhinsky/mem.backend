import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { RedisSessionService } from './services/redis-session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Default, but we override per-sign
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    RedisSessionService,
    JwtAuthGuard,
    CsrfGuard,
  ],
  exports: [AuthService, JwtAuthGuard, CsrfGuard],
})
export class AuthModule {}
