import { IsEnum, IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockMovementType } from '../enums/stock-movement-type.enum';

/**
 * DTO for internal stock movements (called by other modules)
 * Does not require authentication from frontend
 */
export class CreateInternalStockMovementDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  product_id: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0.001, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsUUID()
  source_id?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
