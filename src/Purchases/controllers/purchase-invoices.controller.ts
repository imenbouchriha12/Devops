import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard }                  from '@nestjs/passport';
import { PurchaseInvoicesService }    from '../services/purchase-invoices.service';

import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles }      from '../../auth/decorators/roles.decorators';
import { Role }       from '../../users/enums/role.enum';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { DisputeInvoiceDto, UpdatePaymentAmountDto, UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';

@Controller('businesses/:businessId/purchase-invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PurchaseInvoicesController {

  constructor(private readonly service: PurchaseInvoicesService) {}

  // POST /businesses/:businessId/purchase-invoices
  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreatePurchaseInvoiceDto,
  ) {
    return this.service.create(businessId, dto);
  }

  // GET /businesses/:businessId/purchase-invoices?status=&supplier_id=&due_before=
  @Get()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: any,
  ) {
    return this.service.findAll(businessId, query);
  }

  // GET /businesses/:businessId/purchase-invoices/:id
  @Get(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(businessId, id);
  }

  // PATCH /businesses/:businessId/purchase-invoices/:id
  @Patch(':id')
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return this.service.update(businessId, id, dto);
  }

  // POST /businesses/:businessId/purchase-invoices/:id/approve
  @Post(':id/approve')
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  approve(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.approve(businessId, id);
  }

  // POST /businesses/:businessId/purchase-invoices/:id/dispute
  @Post(':id/dispute')
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  dispute(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeInvoiceDto,
  ) {
    return this.service.dispute(businessId, id, dto);
  }

  // POST /businesses/:businessId/purchase-invoices/:id/resolve-dispute
  @Post(':id/resolve-dispute')
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  resolveDispute(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.resolveDispute(businessId, id);
  }

  // PATCH /businesses/:businessId/purchase-invoices/:id/payment
  // Appelé par Module 5 (Trésorerie) quand un paiement est enregistré
  @Patch(':id/payment')
  @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
  updatePayment(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentAmountDto,
  ) {
    return this.service.updatePayment(businessId, id, dto);
  }
}