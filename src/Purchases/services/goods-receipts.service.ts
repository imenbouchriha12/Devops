import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GoodsReceipt }     from '../entities/goods-receipt.entity';
import { GoodsReceiptItem } from '../entities/goods-receipt-item.entity';
import { SupplierPO }       from '../entities/supplier-po.entity';
import { SupplierPOItem }   from '../entities/supplier-po-item.entity';
import { SupplierPOsService }    from './supplier-pos.service';
import { POStatus }              from '../enum/po-status.enum';
import { CreateGoodsReceiptDto } from '../dto/create-goods-receipt.dto';

@Injectable()
export class GoodsReceiptsService {

  private readonly logger = new Logger(GoodsReceiptsService.name);
  private readonly stocksUrl: string;

  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly grRepo: Repository<GoodsReceipt>,

    @InjectRepository(GoodsReceiptItem)
    private readonly grItemRepo: Repository<GoodsReceiptItem>,

    private readonly supplierPOsService: SupplierPOsService,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    config: ConfigService,
  ) {
    this.stocksUrl = config.get('STOCKS_MODULE_URL', 'http://localhost:3001');
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────
 async create(
    businessId: string,
    poId: string,
    dto: CreateGoodsReceiptDto,
    userId: string,
  ): Promise<GoodsReceipt> {

    // 1. Vérifier que le BC est réceptionnable
    const po = await this.supplierPOsService.findOne(businessId, poId);
    const receivable = [POStatus.CONFIRMED, POStatus.PARTIALLY_RECEIVED];

    if (!receivable.includes(po.status)) {
      throw new BadRequestException(
        `BC en statut "${po.status}" non réceptionnable. ` +
        `Requis : CONFIRMED ou PARTIALLY_RECEIVED.`,
      );
    }

    // 2. Charger les lignes du BC
    const poItems = await this.dataSource
      .getRepository(SupplierPOItem)
      .find({ where: { supplier_po_id: poId } });

    const poItemsMap = new Map(poItems.map((i) => [i.id, i]));

    // 3. Valider les quantités saisies
    this.validateLines(dto.items, poItemsMap);

    // 4. Transaction
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const gr_number = await this.generateNumber(businessId, qr.manager);

      const gr = qr.manager.create(GoodsReceipt, {
        gr_number,
        business_id:    businessId,
        supplier_po_id: poId,
        receipt_date:   dto.receipt_date ? new Date(dto.receipt_date) : new Date(),
        notes:          dto.notes ?? null,
        received_by:    userId,
      });
      const savedGR = await qr.manager.save(GoodsReceipt, gr);

      const grItems: GoodsReceiptItem[] = [];

      for (const line of dto.items) {
        // ← fix 1 : vérifier que poItem existe avant de l'utiliser
        const poItem = poItemsMap.get(line.supplier_po_item_id);
        if (!poItem) {
          throw new BadRequestException(
            `Ligne BC introuvable (id: ${line.supplier_po_item_id})`,
          );
        }

        const grItem = qr.manager.create(GoodsReceiptItem, {
          gr_id:               savedGR.id,
          supplier_po_item_id: line.supplier_po_item_id,
          product_id:          poItem.product_id,
          quantity_received:   line.quantity_received,
          unit_price_ht:       poItem.unit_price_ht,
        });
        grItems.push(await qr.manager.save(GoodsReceiptItem, grItem));

        // Incrémenter quantity_received sur la ligne du BC
        await qr.manager
          .createQueryBuilder()
          .update(SupplierPOItem)
          .set({
            quantity_received: () =>
              `quantity_received + ${line.quantity_received}`,
          })
          .where('id = :id', { id: line.supplier_po_item_id })
          .execute();
      }

      // Recalculer le statut du BC
      await this.supplierPOsService.updateStatusAfterReceipt(
        businessId,
        poId,
        qr.manager,
      );

      await qr.commitTransaction();

      // 5. Notifier Module 4 APRÈS le commit
      await this.notifyStocks(businessId, grItems, userId);

      return this.findOne(businessId, savedGR.id);

    } catch (err: unknown) { // ← fix 2 : typer err comme unknown
      await qr.rollbackTransaction();
      this.logger.error(
        'Erreur création bon de réception',
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ALL par BC
  // ─────────────────────────────────────────────────────────────
  async findAllByPO(businessId: string, poId: string): Promise<GoodsReceipt[]> {
    await this.supplierPOsService.findOne(businessId, poId);
    return this.grRepo.find({
      where:     { supplier_po_id: poId, business_id: businessId },
      relations: ['items'],
      order:     { created_at: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────
  async findOne(businessId: string, id: string): Promise<GoodsReceipt> {
    const gr = await this.grRepo.findOne({
      where:     { id, business_id: businessId },
      relations: ['items', 'items.supplier_po_item', 'supplier_po', 'supplier_po.supplier'],
    });
    if (!gr) throw new NotFoundException(`Bon de réception introuvable (id: ${id})`);
    return gr;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private validateLines(
    lines: CreateGoodsReceiptDto['items'],
    poItemsMap: Map<string, SupplierPOItem>,
  ) {
    for (const line of lines) {
      const poItem = poItemsMap.get(line.supplier_po_item_id);

      if (!poItem) {
        throw new BadRequestException(
          `Ligne BC introuvable (id: ${line.supplier_po_item_id})`,
        );
      }

      const reliquat =
        Number(poItem.quantity_ordered) - Number(poItem.quantity_received);

      if (reliquat <= 0) {
        throw new BadRequestException(
          `"${poItem.description}" est déjà entièrement réceptionné.`,
        );
      }

      if (line.quantity_received > reliquat) {
        throw new BadRequestException(
          `Quantité saisie (${line.quantity_received}) > reliquat (${reliquat}) ` +
          `pour "${poItem.description}".`,
        );
      }
    }
  }

  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await manager
      .createQueryBuilder(GoodsReceipt, 'gr')
      .where('gr.business_id = :businessId', { businessId })
      .andWhere('EXTRACT(YEAR FROM gr.created_at) = :year', { year })
      .getCount();
    return `BR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async notifyStocks(
    businessId: string,
    items: GoodsReceiptItem[],
    userId: string,
  ): Promise<void> {
    for (const item of items) {
      if (!item.product_id) continue;

      try {
        await firstValueFrom(
          this.httpService.post(
            `${this.stocksUrl}/api/v1/businesses/${businessId}/stock-movements/internal`,
            {
              type:          'ENTREE_ACHAT',
              product_id:    item.product_id,
              quantity:      item.quantity_received,
              unit_price_ht: item.unit_price_ht,
              source_type:   'GoodsReceiptItem',
              source_id:     item.id,
              created_by:    userId,
            },
          ),
        );
      } catch (err: any) {
        // Log SANS throw — la réception ne doit pas être annulée si Module 4 est down
        this.logger.error(
          `Module 4 injoignable pour product ${item.product_id}. ` +
          `Stock non mis à jour. GoodsReceiptItem id: ${item.id}`,
          err.message,
        );
      }
    }
  }
}