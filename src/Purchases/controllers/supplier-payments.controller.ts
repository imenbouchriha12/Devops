// src/Purchases/controllers/supplier-payments.controller.ts
import {
  Body, Controller, Get, Param, Post, Query,
  ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard }               from '@nestjs/passport';
import { SupplierPaymentsService } from '../services/supplier-payments.service';
import { CreateSupplierPaymentDto, QuerySupplierPaymentsDto } from '../dto/supplier-payment.dto';

// FIX: votre projet n'a pas de JwtAuthGuard fichier séparé.
// Il utilise AuthGuard('jwt') de @nestjs/passport directement —
// c'est le même guard que dans vos autres controllers existants.

@UseGuards(AuthGuard('jwt'))
@Controller('businesses/:businessId/supplier-payments')
export class SupplierPaymentsController {

  constructor(private readonly svc: SupplierPaymentsService) {}

  // POST /businesses/:businessId/supplier-payments
  @Post()
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateSupplierPaymentDto,
    @Req() req: any,
  ) {
    return this.svc.create(businessId, dto, req.user.id);
  }

  // GET /businesses/:businessId/supplier-payments
  @Get()
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: QuerySupplierPaymentsDto,
  ) {
    return this.svc.findAll(businessId, query);
  }

  // GET /businesses/:businessId/supplier-payments/:id
  // IMPORTANT: cette route doit être AVANT 'stats/:supplierId'
  // sinon NestJS matche 'stats' comme un :id UUID → 400 BadRequest
  @Get(':id')
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id',         ParseUUIDPipe) id:         string,
  ) {
    return this.svc.findOne(businessId, id);
  }

  // GET /businesses/:businessId/supplier-payments/stats/:supplierId
  @Get('stats/:supplierId')
  getStats(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
  ) {
    return this.svc.getSupplierStats(businessId, supplierId);
  }
}