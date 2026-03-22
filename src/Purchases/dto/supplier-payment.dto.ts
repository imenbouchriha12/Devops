// src/Purchases/dto/supplier-payment.dto.ts
import { Transform } from 'class-transformer';
import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, IsUUID, Max, Min,
  IsBoolean,
} from 'class-validator';
import { PaymentMethod } from '../entities/supplier-payment.entity';

export class CreateSupplierPaymentDto {
  @IsUUID()
  supplier_id: string;

  @IsOptional()
  @IsUUID()
  purchase_invoice_id?: string;

  @IsDateString()
  payment_date: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  amount: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QuerySupplierPaymentsDto {
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsOptional()
  @IsUUID()
  purchase_invoice_id?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 1)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 20)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}