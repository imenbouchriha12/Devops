import { IsUUID, IsEnum, IsInt, IsString, IsOptional } from 'class-validator';
import { StockMovementType } from '../enums/stock-movement-type.enum';

export class CreateStockMovementDto {
  @IsUUID()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
