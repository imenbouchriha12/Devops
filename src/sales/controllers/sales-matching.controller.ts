// src/sales/controllers/sales-matching.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalesMatchingService } from '../services/sales-matching.service';

@UseGuards(AuthGuard('jwt'))
@Controller('businesses/:businessId/sales-matching')
export class SalesMatchingController {
  constructor(private readonly svc: SalesMatchingService) {}

  // GET /businesses/:bId/sales-matching/invoice/:invoiceId
  // Rapprochement d'une facture spécifique
  @Get('invoice/:invoiceId')
  matchInvoice(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.svc.matchInvoice(businessId, invoiceId, false);
  }

  // GET /businesses/:bId/sales-matching/draft
  // Rapprochement de toutes les factures DRAFT
  @Get('draft')
  matchAllDraft(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.svc.matchAllDraft(businessId);
  }
}
