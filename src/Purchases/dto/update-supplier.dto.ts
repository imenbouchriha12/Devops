import { PartialType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { CreateSupplierDto } from "./create-supplier.dto";

 
// ── UPDATE ──────────────────────────────────────────────────────
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @IsOptional() @IsBoolean()
  is_active?: boolean;
}
 
// ── QUERY PARAMS ────────────────────────────────────────────────
export class QuerySuppliersDto {
  @IsOptional() @IsString()
  search?: string;
 
  @IsOptional() @IsString()
  category?: string;
 
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
 
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  page?: number = 1;
 
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1) @Max(100)
  limit?: number = 20;
}