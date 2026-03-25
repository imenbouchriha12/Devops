// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', '..', 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map(err => {
          const constraints = Object.values(err.constraints ?? {});
          return {
            field: err.property,
            messages: constraints,
          };
        });
        return new BadRequestException({
          statusCode: 400,
          error: 'Validation échouée',
          details: messages,
          message: messages.flatMap(m => m.messages),
        });
      },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}

bootstrap();