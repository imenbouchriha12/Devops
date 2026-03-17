import { IsBoolean, IsOptional } from "class-validator";
import { CreateSupplierDto } from "./create-supplier.dto";
import { PartialType } from '@nestjs/mapped-types';
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
 
  // Champ supplémentaire uniquement disponible à la mise à jour
  // Permet de réactiver un fournisseur archivé via PATCH
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}