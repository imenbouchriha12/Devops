// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  // Increase payload size limit for image uploads (10MB)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // This makes class-validator decorators actually work on request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strips properties not in the DTO
      forbidNonWhitelisted: true, // throws error if extra properties sent
      transform: true,       // auto-converts types (e.g. string "5" → number 5)
    }),
  );

  // Allow React dev server to hit this backend.
  // Vite defaults to port 5173. If yours is different, change it here.
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}

bootstrap();