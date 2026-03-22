import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { SalesOrderStatus } from '../entities/sales-order.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';

const TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  [SalesOrderStatus.CONFIRMED]: [SalesOrderStatus.IN_PROGRESS, SalesOrderStatus.CANCELLED],
  [SalesOrderStatus.IN_PROGRESS]: [SalesOrderStatus.DELIVERED, SalesOrderStatus.CANCELLED],
  [SalesOrderStatus.DELIVERED]: [SalesOrderStatus.INVOICED],
  [SalesOrderStatus.INVOICED]: [],
  [SalesOrderStatus.CANCELLED]: [],
};

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,

    @InjectRepository(SalesOrderItem)
    private readonly itemRepo: Repository<SalesOrderItem>,

    private readonly dataSource: DataSource,
  ) {}

  async create(businessId: string, dto: CreateSalesOrderDto): Promise<SalesOrder> {
    return this.dataSource.transaction(async (manager) => {
      const orderNumber = await this.generateNumber(businessId, manager);
      const { items: itemsDto, ...rest } = dto;
      const { subtotal, taxAmount, netAmount, items } = this.calcTotals(itemsDto);

      const order = manager.create(SalesOrder, {
        ...rest,
        orderNumber,
        businessId,
        status: SalesOrderStatus.CONFIRMED,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        timbreFiscal: 1.000,
        netAmount,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
      });
      const saved = await manager.save(SalesOrder, order);

      const lines = items.map((item, i) =>
        manager.create(SalesOrderItem, {
          ...item,
          salesOrderId: saved.id,
        }),
      );
      await manager.save(SalesOrderItem, lines);

      return manager.findOne(SalesOrder, {
        where: { id: saved.id },
        relations: ['items', 'client'],
      }) as Promise<SalesOrder>;
    });
  }

  async findAll(businessId: string, query: any) {
    const { client_id, status, page = 1, limit = 20 } = query;

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .where('order.businessId = :businessId', { businessId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim());
      qb.andWhere('order.status IN (:...statuses)', { statuses });
    }
    if (client_id) qb.andWhere('order.clientId = :client_id', { client_id });

    const [data, total] = await qb.getManyAndCount();
    const total_pages = Math.ceil(total / limit);
    return { data, total, page, limit, total_pages };
  }

  async findOne(businessId: string, id: string): Promise<SalesOrder> {
    const order = await this.orderRepo.findOne({
      where: { id, businessId },
      relations: ['items', 'client'],
    });
    if (!order) throw new NotFoundException(`Commande introuvable (id: ${id})`);
    return order;
  }

  async update(businessId: string, id: string, dto: UpdateSalesOrderDto): Promise<SalesOrder> {
    const order = await this.findOne(businessId, id);

    if (order.status !== SalesOrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Modification impossible. Statut actuel : ${order.status}. Requis : CONFIRMED.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.expectedDelivery !== undefined)
        order.expectedDelivery = dto.expectedDelivery ? new Date(dto.expectedDelivery) : null;
      if (dto.notes !== undefined)
        order.notes = dto.notes;

      if (dto.items?.length) {
        await manager.delete(SalesOrderItem, { salesOrderId: id });

        const { subtotal, taxAmount, netAmount, items } = this.calcTotals(dto.items);
        order.subtotal = subtotal;
        order.taxAmount = taxAmount;
        order.total = subtotal + taxAmount;
        order.netAmount = netAmount;

        await manager.save(SalesOrder, order);

        const lines = items.map((item) =>
          manager.create(SalesOrderItem, {
            ...item,
            salesOrderId: id,
          }),
        );
        await manager.save(SalesOrderItem, lines);
      } else {
        await manager.save(SalesOrder, order);
      }

      return manager.findOne(SalesOrder, {
        where: { id },
        relations: ['items', 'client'],
      }) as Promise<SalesOrder>;
    });
  }

  async startProgress(businessId: string, id: string) {
    return this.transition(businessId, id, SalesOrderStatus.IN_PROGRESS);
  }

  async markDelivered(businessId: string, id: string) {
    return this.transition(businessId, id, SalesOrderStatus.DELIVERED, (o) => {
      o.deliveryDate = new Date();
    });
  }

  async markInvoiced(businessId: string, id: string) {
    return this.transition(businessId, id, SalesOrderStatus.INVOICED);
  }

  async cancel(businessId: string, id: string) {
    return this.transition(businessId, id, SalesOrderStatus.CANCELLED);
  }

  private async transition(
    businessId: string,
    id: string,
    target: SalesOrderStatus,
    mutate?: (order: SalesOrder) => void,
  ): Promise<SalesOrder> {
    const order = await this.findOne(businessId, id);
    const allowed = TRANSITIONS[order.status];

    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Transition invalide : ${order.status} → ${target}. ` +
        `Autorisées : ${allowed.join(', ') || 'aucune (statut terminal)'}`,
      );
    }

    order.status = target;
    if (mutate) mutate(order);
    await this.orderRepo.save(order);
    return this.findOne(businessId, id);
  }

  private calcTotals(itemsDto: CreateSalesOrderDto['items']) {
    let subtotal = 0;
    let taxAmount = 0;

    const items = itemsDto.map((item) => {
      const total = this.round(item.quantity * item.unitPrice);
      const itemTax = this.round(total * (item.taxRate / 100));
      subtotal += total;
      taxAmount += itemTax;
      return { ...item, total };
    });

    subtotal = this.round(subtotal);
    taxAmount = this.round(taxAmount);
    const netAmount = this.round(subtotal + taxAmount + 1.000);
    return { subtotal, taxAmount, netAmount, items };
  }

  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CMD-${year}-`;

    const result = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SUBSTRING("orderNumber" FROM ${prefix.length + 1}) AS INTEGER)),
        0
      ) + 1 AS next_seq
      FROM sales_orders
      WHERE "businessId" = $1
        AND "orderNumber" LIKE $2`,
      [businessId, `${prefix}%`],
    );

    const seq = String(result[0]?.next_seq ?? 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }
}
