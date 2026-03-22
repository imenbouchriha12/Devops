import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplierPO }     from '../entities/supplier-po.entity';
import { SupplierPOItem } from '../entities/supplier-po-item.entity';
import { POStatus }       from '../enum/po-status.enum';
import { SuppliersService } from '../services/suppliers.service';
import { CreateSupplierPODto } from '../dto/create-supplier-po.dto';
import { UpdateSupplierPODto } from '../dto/update-supplier-po.dto';

const TRANSITIONS: Record<POStatus, POStatus[]> = {
  [POStatus.DRAFT]:              [POStatus.SENT, POStatus.CANCELLED],
  [POStatus.SENT]:               [POStatus.CONFIRMED, POStatus.CANCELLED],
  [POStatus.CONFIRMED]:          [POStatus.PARTIALLY_RECEIVED, POStatus.FULLY_RECEIVED, POStatus.CANCELLED],
  [POStatus.PARTIALLY_RECEIVED]: [POStatus.FULLY_RECEIVED],
  [POStatus.FULLY_RECEIVED]:     [],
  [POStatus.CANCELLED]:          [],
};

@Injectable()
export class SupplierPOsService {

  constructor(
    @InjectRepository(SupplierPO)
    private readonly poRepo: Repository<SupplierPO>,

    @InjectRepository(SupplierPOItem)
    private readonly itemRepo: Repository<SupplierPOItem>,

    private readonly suppliersService: SuppliersService,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────
  async create(businessId: string, dto: CreateSupplierPODto): Promise<SupplierPO> {
    await this.suppliersService.findOneOrFail(businessId, dto.supplier_id);

    return this.dataSource.transaction(async (manager) => {
      const po_number = await this.generateNumber(businessId, manager);
      const { items: itemsDto, ...rest } = dto;
      const { subtotal_ht, tax_amount, net_amount, items } = this.calcTotals(itemsDto);

      const po = manager.create(SupplierPO, {
        ...rest,
        po_number,
        business_id:   businessId,
        status:        POStatus.DRAFT,
        subtotal_ht,
        tax_amount,
        timbre_fiscal: 1.000,
        net_amount,
      });
      const saved = await manager.save(SupplierPO, po);

      const lines = items.map((item, i) =>
        manager.create(SupplierPOItem, {
          ...item,
          supplier_po_id: saved.id,
          sort_order:     item.sort_order ?? i,
        }),
      );
      await manager.save(SupplierPOItem, lines);

  return manager.findOne(SupplierPO, {
    where: { id: saved.id },
    relations: ['items', 'supplier'],
  }) as Promise<SupplierPO>;   // ← OU cast comme ça
});
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────────────────────────
  async findAll(businessId: string, query: any) {
    const { supplier_id, status, date_from, date_to, page = 1, limit = 20 } = query;

    const qb = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.business_id = :businessId', { businessId })
      .orderBy('po.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim());
      qb.andWhere('po.status IN (:...statuses)', { statuses });
    }
    if (supplier_id) qb.andWhere('po.supplier_id = :supplier_id', { supplier_id });
    if (date_from)   qb.andWhere('po.created_at >= :date_from', { date_from });
    if (date_to)     qb.andWhere('po.created_at <= :date_to', { date_to });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────
  async findOne(businessId: string, id: string): Promise<SupplierPO> {
    const po = await this.poRepo.findOne({
      where: { id, business_id: businessId },
      relations: ['items', 'supplier'],
    });
    if (!po) throw new NotFoundException(`BC introuvable (id: ${id})`);
    return po;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE — DRAFT seulement
  // ─────────────────────────────────────────────────────────────
async update(businessId: string, id: string, dto: UpdateSupplierPODto): Promise<SupplierPO> {
    const po = await this.findOne(businessId, id);

    if (po.status !== POStatus.DRAFT) {
      throw new BadRequestException(
        `Modification impossible. Statut actuel : ${po.status}. Requis : DRAFT.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {

      if (dto.expected_delivery !== undefined)
        po.expected_delivery = new Date(dto.expected_delivery);
      if (dto.notes !== undefined)
        po.notes = dto.notes;

      if (dto.items?.length) {

        // 1. Supprimer les anciennes lignes en DB
        await manager.delete(SupplierPOItem, { supplier_po_id: id });

        // 2. Recalculer les totaux
        const { subtotal_ht, tax_amount, net_amount, items } = this.calcTotals(dto.items);
        po.subtotal_ht = subtotal_ht;
        po.tax_amount  = tax_amount;
        po.net_amount  = net_amount;

        // 3. Vider items sur l'objet pour éviter que TypeORM
        //    les re-sauvegarde via cascade avec supplier_po_id = null
        po.items = [];

        // 4. Sauvegarder le BC (sans les items)
        await manager.save(SupplierPO, po);

        // 5. Créer les nouvelles lignes sans id
        const lines = items.map((item, i) => {
          const { id: _ignored, ...itemWithoutId } = item as any;
          return manager.create(SupplierPOItem, {
            ...itemWithoutId,
            supplier_po_id: id,
            sort_order:     itemWithoutId.sort_order ?? i,
          });
        });

        await manager.save(SupplierPOItem, lines);

      } else {
        // Pas de nouvelles lignes — juste sauvegarder le BC
        po.items = [];
        await manager.save(SupplierPO, po);
      }

      // 6. Retourner le BC complet avec ses nouvelles lignes
      return manager.findOne(SupplierPO, {
        where:     { id },
        relations: ['items', 'supplier'],
      }) as Promise<SupplierPO>;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // TRANSITIONS
  // ─────────────────────────────────────────────────────────────
  async send(businessId: string, id: string) {
    return this.transition(businessId, id, POStatus.SENT, (po) => {
      po.sent_at = new Date();
    });
  }

  async confirm(businessId: string, id: string) {
    return this.transition(businessId, id, POStatus.CONFIRMED);
  }

  async cancel(businessId: string, id: string) {
    const po = await this.findOne(businessId, id);
    if (
      po.status === POStatus.PARTIALLY_RECEIVED ||
      po.status === POStatus.FULLY_RECEIVED
    ) {
      throw new BadRequestException(
        `Annulation impossible : des marchandises ont déjà été réceptionnées.`,
      );
    }
    return this.transition(businessId, id, POStatus.CANCELLED);
  }

  // ─────────────────────────────────────────────────────────────
  // Appelé par GoodsReceiptsService après chaque réception
  // ─────────────────────────────────────────────────────────────
  async updateStatusAfterReceipt(
    businessId: string,
    poId: string,
    manager: any,
  ): Promise<void> {
    const po = await manager.findOne(SupplierPO, {
      where: { id: poId, business_id: businessId },
      relations: ['items'],
    });
    if (!po) return;

    const allReceived = po.items.every(
      (item: SupplierPOItem) =>
        Number(item.quantity_received) >= Number(item.quantity_ordered),
    );
    const anyReceived = po.items.some(
      (item: SupplierPOItem) => Number(item.quantity_received) > 0,
    );

    if (allReceived)      po.status = POStatus.FULLY_RECEIVED;
    else if (anyReceived) po.status = POStatus.PARTIALLY_RECEIVED;

    await manager.save(SupplierPO, po);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private async transition(
    businessId: string,
    id: string,
    target: POStatus,
    mutate?: (po: SupplierPO) => void,
  ): Promise<SupplierPO> {
    const po = await this.findOne(businessId, id);
    const allowed = TRANSITIONS[po.status];

    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Transition invalide : ${po.status} → ${target}. ` +
        `Autorisées : ${allowed.join(', ') || 'aucune (statut terminal)'}`,
      );
    }

    po.status = target;
    if (mutate) mutate(po);
    await this.poRepo.save(po);
    return this.findOne(businessId, id);
  }

  private calcTotals(itemsDto: CreateSupplierPODto['items']) {
    let subtotal_ht = 0;
    let tax_amount  = 0;

    const items = itemsDto.map((item) => {
      const line_total_ht = this.round(item.quantity_ordered * item.unit_price_ht);
      const line_tax      = this.round(line_total_ht * (item.tax_rate_value / 100));
      subtotal_ht += line_total_ht;
      tax_amount  += line_tax;
      return { ...item, line_total_ht, line_tax };
    });

    subtotal_ht  = this.round(subtotal_ht);
    tax_amount   = this.round(tax_amount);
    const net_amount = this.round(subtotal_ht + tax_amount + 1.000);
    return { subtotal_ht, tax_amount, net_amount, items };
  }

  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await manager
      .createQueryBuilder(SupplierPO, 'po')
      .where('po.business_id = :businessId', { businessId })
      .andWhere('EXTRACT(YEAR FROM po.created_at) = :year', { year })
      .getCount();
    return `ACH-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }
}