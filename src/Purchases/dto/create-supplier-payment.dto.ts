
import { IsUUID, IsDateString, IsDecimal, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreateSupplierPaymentDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  supplier_id: string;

  @IsDecimal()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsDateString()
  payment_date: Date;

  @IsOptional()
  notes?: string;
}