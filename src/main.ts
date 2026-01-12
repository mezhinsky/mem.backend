import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser middleware - required for reading cookies
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('mem.backend')
    .setDescription('The mem.backend API description')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS configuration for cross-domain authentication
  // FRONTEND_ORIGIN must be set in production (e.g., https://mem.app)
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

  app.enableCors({
    origin: frontendOrigin.split(',').map((o) => o.trim()),
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
