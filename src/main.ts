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
  // FRONTEND_ORIGIN can be a comma-separated list (e.g. "https://admin.app,https://frontend.app").
  // In development, allow localhost dev servers by default.
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendOriginEnv = process.env.FRONTEND_ORIGIN;
  const allowedOrigins = (
    frontendOriginEnv
      ? frontendOriginEnv.split(',')
      : isProduction
        ? []
        : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000']
  )
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser requests (curl, server-to-server)
      if (!origin) return callback(null, true);

      // explicit allow-list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // dev convenience: allow any localhost port
      if (!isProduction && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
