
import { IsUUID, IsDateString, IsDecimal, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '../enum/payment-method.enum';

export class UpdateSupplierPaymentDto {
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