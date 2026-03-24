import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';
import { SalesDashboardService } from '../services/sales-dashboard.service';

@Controller('businesses/:businessId/sales/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalesDashboardController {
  constructor(private readonly service: SalesDashboardService) {}

  @Get()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  getDashboardStats(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.service.getDashboardStats(businessId);
  }
}
