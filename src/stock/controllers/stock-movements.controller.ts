import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { StockMovementsService } from '../services/stock-movements.service';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { CreateInternalStockMovementDto } from '../dto/create-internal-stock-movement.dto';
import { QueryStockMovementsDto } from '../dto/query-stock-movements.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BusinessAccessGuard } from '../../businesses/guards/business-access.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';

@Controller('businesses/:businessId/stock-movements')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessAccessGuard)
export class StockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  /**
   * Create a manual stock movement
   * For BUSINESS_OWNER/ADMIN only
   */
  @Post('manual')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  createManual(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() createDto: CreateStockMovementDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.stockMovementsService.createManual(
      businessId,
      createDto,
      userId,
    );
  }

  /**
   * Get all stock movements with filters
   */
  @Get()
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: QueryStockMovementsDto,
  ) {
    return this.stockMovementsService.findAll(businessId, query);
  }

  /**
   * Get a single stock movement
   */
  @Get(':id')
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.stockMovementsService.findOne(businessId, id);
  }

  /**
   * Get stock movement history for a product
   */
  @Get('product/:productId/history')
  getProductHistory(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.stockMovementsService.getProductHistory(
      businessId,
      productId,
      limit,
    );
  }

  /**
   * Get stock summary for a product
   */
  @Get('product/:productId/summary')
  getProductStockSummary(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.stockMovementsService.getProductStockSummary(
      businessId,
      productId,
    );
  }

  /**
   * Get stock movements by source
   */
  @Get('source/:sourceType/:sourceId')
  getBySource(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('sourceType') sourceType: string,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
  ) {
    return this.stockMovementsService.getBySource(
      businessId,
      sourceType,
      sourceId,
    );
  }
}

/**
 * Internal controller for stock movements
 * No authentication required - used by other backend modules
 */
@Controller('internal/stock-movements')
export class InternalStockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  /**
   * Create an internal stock movement
   * Called by other modules (invoices, purchases, etc.)
   */
  @Post()
  createInternal(@Body() createDto: CreateInternalStockMovementDto) {
    return this.stockMovementsService.createInternal(createDto);
  }
}
