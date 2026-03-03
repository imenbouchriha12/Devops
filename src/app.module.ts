// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module'
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity'
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantsModule } from './tenants/tenants.module';
import { BusinessSettings } from './businesses/entities/business-settings.entity';
import { Business } from './businesses/entities/business.entity';
import { BusinessesModule } from './businesses/businesses.module';
import { TaxRate } from './businesses/entities/tax-rate.entity';
import { Client } from './clients/entities/client.entity';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    // ConfigModule loads .env and makes values available everywhere via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,      // no need to import ConfigModule in every module
      envFilePath: '.env', // path to your .env file
    }),

    // TypeORM connects to PostgreSQL using values from .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +(configService.get<number>('DB_PORT') ?? 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, RefreshToken, PasswordResetToken, Tenant, Business, BusinessSettings, TaxRate, Client],
        synchronize: true,  // auto-creates/updates tables. SET TO FALSE in production.
        logging: true,      // logs every SQL query to console. Useful for debugging.
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    TenantsModule,
    BusinessesModule,
    ClientsModule,
  ],
})
export class AppModule {}