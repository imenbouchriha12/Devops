import { IsEnum, IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockMovementType } from '../enums/stock-movement-type.enum';

export class CreateStockMovementDto {
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
}
