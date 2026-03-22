// src/Purchases/controllers/supplier-scoring.controller.ts
import {
  Controller, Get, Param, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { AuthGuard }             from '@nestjs/passport';
import { SupplierScoringService } from '../services/supplier-scoring.service';

@UseGuards(AuthGuard('jwt'))
@Controller('businesses/:businessId/supplier-scoring')
export class SupplierScoringController {

  constructor(private readonly svc: SupplierScoringService) {}

  // GET /businesses/:bId/supplier-scoring/ranking
  // Classement de tous les fournisseurs
  @Get('ranking')
  ranking(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.svc.rankSuppliers(businessId);
  }

  // GET /businesses/:bId/supplier-scoring/:supplierId
  // Score détaillé d'un fournisseur
  @Get(':supplierId')
  score(
    @Param('businessId',  ParseUUIDPipe) businessId:  string,
    @Param('supplierId',  ParseUUIDPipe) supplierId:  string,
  ) {
    return this.svc.scoreSupplier(businessId, supplierId);
  }
}