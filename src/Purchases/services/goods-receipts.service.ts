// src/Purchases/services/goods-receipts.service.ts
//
// VERSION MONOLITHE — tout tourne sur le même port NestJS.
// On supprime complètement : HttpService, ConfigService, firstValueFrom, notifyStocks().
// On appelle directement StockMovementsService depuis le même process.
//
// ⚠️  Si votre module Stock utilise encore des mock data (pas de vrai service),
//     commentez simplement l'injection de StockMovementsService et le bloc updateStock()
//     — tout le reste fonctionne indépendamment.


//hedi s7i7a
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,        // ← permet d'injecter StockMovementsService comme optionnel
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { GoodsReceipt }       from '../entities/goods-receipt.entity';
import { GoodsReceiptItem }   from '../entities/goods-receipt-item.entity';
import { SupplierPOItem }     from '../entities/supplier-po-item.entity';
import { SupplierPOsService } from './supplier-pos.service';
import { POStatus }           from '../enum/po-status.enum';
import { CreateGoodsReceiptDto } from '../dto/create-goods-receipt.dto';
import { StockMovementsService } from 'src/stock/services/stock-movements/stock-movements.service';

// Adaptez ce chemin selon la structure réelle de votre module Stock
// Si le service n'existe pas encore, commentez cette ligne

@Injectable()
export class GoodsReceiptsService {

  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly grRepo: Repository<GoodsReceipt>,

    @InjectRepository(GoodsReceiptItem)
    private readonly grItemRepo: Repository<GoodsReceiptItem>,

    private readonly supplierPOsService: SupplierPOsService,
    private readonly dataSource: DataSource,

    // @Optional() permet de démarrer même si StockModule n'est pas encore importé.
    // Quand le module Stock sera prêt, retirez @Optional() pour rendre l'injection obligatoire.
    @Optional()
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────
  async create(
    businessId: string,
    poId: string,
    dto: CreateGoodsReceiptDto,
    userId: string,
  ): Promise<GoodsReceipt> {

    const po = await this.supplierPOsService.findOne(businessId, poId);

    if (![POStatus.CONFIRMED, POStatus.PARTIALLY_RECEIVED].includes(po.status)) {
      throw new BadRequestException(
        `BC en statut "${po.status}" non réceptionnable. ` +
        `Requis : CONFIRMED ou PARTIALLY_RECEIVED.`,
      );
    }

    const poItems = await this.dataSource
      .getRepository(SupplierPOItem)
      .find({ where: { supplier_po_id: poId } });

    const poItemsMap = new Map(poItems.map(i => [i.id, i]));

    this.validateLines(dto.items, poItemsMap);

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
        const poItem = poItemsMap.get(line.supplier_po_item_id)!;

        const grItem = qr.manager.create(GoodsReceiptItem, {
          gr_id:               savedGR.id,
          supplier_po_item_id: line.supplier_po_item_id,
          product_id:          poItem.product_id ?? null,
          quantity_received:   line.quantity_received,
          unit_price_ht:       poItem.unit_price_ht,
        });
        grItems.push(await qr.manager.save(GoodsReceiptItem, grItem));

        // Incrémenter quantity_received sur la ligne BC
        await qr.manager
          .createQueryBuilder()
          .update(SupplierPOItem)
          .set({ quantity_received: () => `quantity_received + ${line.quantity_received}` })
          .where('id = :id', { id: line.supplier_po_item_id })
          .execute();
      }

      await this.supplierPOsService.updateStatusAfterReceipt(businessId, poId, qr.manager);

      await qr.commitTransaction();

      // Mettre à jour le stock APRÈS le commit (appel direct interne, pas d'HTTP)
      await this.updateStock(businessId, grItems, userId);

      return this.findOne(businessId, savedGR.id);

    } catch (err: unknown) {
      await qr.rollbackTransaction();
      this.logger.error('Erreur création BR', err instanceof Error ? err.stack : String(err));
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────
  async findAllByPO(businessId: string, poId: string): Promise<GoodsReceipt[]> {
    await this.supplierPOsService.findOne(businessId, poId);
    return this.grRepo.find({
      where:     { supplier_po_id: poId, business_id: businessId },
      relations: ['items'],
      order:     { created_at: 'DESC' },
    });
  }

  async findOne(businessId: string, id: string): Promise<GoodsReceipt> {
    const gr = await this.grRepo.findOne({
      where:     { id, business_id: businessId },
      relations: ['items', 'items.supplier_po_item', 'supplier_po', 'supplier_po.supplier'],
    });
    if (!gr) throw new NotFoundException(`Bon de réception introuvable (id: ${id})`);
    return gr;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVÉ
  // ─────────────────────────────────────────────────────────────────────────────
  private validateLines(
    lines: CreateGoodsReceiptDto['items'],
    poItemsMap: Map<string, SupplierPOItem>,
  ) {
    for (const line of lines) {
      const poItem = poItemsMap.get(line.supplier_po_item_id);
      if (!poItem) {
        throw new BadRequestException(`Ligne BC introuvable (id: ${line.supplier_po_item_id})`);
      }
      const reliquat = Number(poItem.quantity_ordered) - Number(poItem.quantity_received);
      if (reliquat <= 0) {
        throw new BadRequestException(`"${poItem.description}" est déjà entièrement réceptionné.`);
      }
      if (line.quantity_received > reliquat) {
        throw new BadRequestException(
          `Quantité saisie (${line.quantity_received}) > reliquat (${reliquat}) pour "${poItem.description}".`,
        );
      }
    }
  }

  // Numérotation sans race condition (MAX au lieu de COUNT)
  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = `BR-${year}-`;
    const result = await manager.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(gr_number FROM ${prefix.length + 1}) AS INTEGER)), 0) + 1 AS next_seq
       FROM goods_receipts
       WHERE business_id = $1 AND gr_number LIKE $2`,
      [businessId, `${prefix}%`],
    );
    const seq = String(result[0]?.next_seq ?? 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  // Appel direct au service NestJS — AUCUN HTTP en interne
  //
  // CAS 1 — StockMovementsService existe déjà dans votre module Stock :
  //   → Il sera injecté automatiquement (voir purchases.module.ts ci-dessous)
  //   → Le stock est mis à jour immédiatement après chaque réception
  //
  // CAS 2 — Module Stock encore en mock data :
  //   → stockMovementsService sera null grâce à @Optional()
  //   → Le log "Stock non disponible" apparaît mais le BR est créé normalement
  //   → Quand le module Stock sera prêt, tout fonctionnera sans autre changement
  private async updateStock(
    businessId: string,
    items: GoodsReceiptItem[],
    userId: string,
  ): Promise<void> {
    if (!this.stockMovementsService) {
      this.logger.warn(
        'StockMovementsService non disponible — stock non mis à jour. ' +
        'Importez StockModule dans PurchasesModule quand le module Stock sera prêt.',
      );
      return;
    }

    for (const item of items) {
      // Lignes sans produit catalogue → pas de mouvement stock
      if (!item.product_id) continue;

      /*try {
        // Adaptez le nom de la méthode selon votre StockMovementsService réel
        await this.stockMovementsService.createInternal({
          business_id:    businessId,
          product_id:     item.product_id,
          type:           'ENTREE_ACHAT',
          quantity:       Number(item.quantity_received),
          unit_cost:      Number(item.unit_price_ht),
          reference_type: 'GoodsReceiptItem',
          reference_id:   item.id,
          created_by:     userId,
        });
      } catch (err: any) {
        // Log sans throw — le BR est déjà sauvegardé, on ne rollback pas pour ça
        this.logger.error(
          `Erreur mise à jour stock product_id=${item.product_id} : ${err.message}`,
        );
      }*/
    }
  }
}