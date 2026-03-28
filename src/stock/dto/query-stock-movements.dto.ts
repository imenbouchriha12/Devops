import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { StockMovementType } from '../enums/stock-movement-type.enum';

export class QueryStockMovementsDto {
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}
