import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { DeliveryNoteItem } from '../entities/delivery-note-item.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { CreateDeliveryNoteDto } from '../dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from '../dto/update-delivery-note.dto';

@Injectable()
export class DeliveryNotesService {
  constructor(
    @InjectRepository(DeliveryNote)
    private readonly noteRepo: Repository<DeliveryNote>,

    @InjectRepository(DeliveryNoteItem)
    private readonly itemRepo: Repository<DeliveryNoteItem>,

    private readonly dataSource: DataSource,
  ) {}

  async create(businessId: string, dto: CreateDeliveryNoteDto): Promise<DeliveryNote> {
    return this.dataSource.transaction(async (manager) => {
      const deliveryNoteNumber = await this.generateNumber(businessId, manager);
      const { items: itemsDto, ...rest } = dto;

      const note = manager.create(DeliveryNote, {
        ...rest,
        deliveryNoteNumber,
        businessId,
        status: 'pending',
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
      });
      const saved = await manager.save(DeliveryNote, note);

      const lines = itemsDto.map((item) =>
        manager.create(DeliveryNoteItem, {
          ...item,
          deliveryNoteId: saved.id,
        }),
      );
      await manager.save(DeliveryNoteItem, lines);

      return manager.findOne(DeliveryNote, {
        where: { id: saved.id },
        relations: ['items', 'client'],
      }) as Promise<DeliveryNote>;
    });
  }

  async findAll(businessId: string, query: any) {
    const { client_id, status, sales_order_id, page = 1, limit = 20 } = query;

    const qb = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.client', 'client')
      .leftJoinAndSelect('note.items', 'items')
      .where('note.businessId = :businessId', { businessId })
      .orderBy('note.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('note.status = :status', { status });
    if (client_id) qb.andWhere('note.clientId = :client_id', { client_id });
    if (sales_order_id) qb.andWhere('note.salesOrderId = :sales_order_id', { sales_order_id });

    const [data, total] = await qb.getManyAndCount();
    const total_pages = Math.ceil(total / limit);
    return { data, total, page, limit, total_pages };
  }

  async findOne(businessId: string, id: string): Promise<DeliveryNote> {
    const note = await this.noteRepo.findOne({
      where: { id, businessId },
      relations: ['items', 'client', 'salesOrder', 'salesOrder.items'],
    });
    if (!note) throw new NotFoundException(`Bon de livraison introuvable (id: ${id})`);
    return note;
  }

  async update(businessId: string, id: string, dto: UpdateDeliveryNoteDto): Promise<DeliveryNote> {
    const note = await this.findOne(businessId, id);

    console.log('🔧 Mise à jour BL:', id);
    console.log('🔧 Items reçus:', dto.items?.length, dto.items);

    await this.dataSource.transaction(async (manager) => {
      if (dto.deliveryDate !== undefined)
        note.deliveryDate = new Date(dto.deliveryDate);
      if (dto.notes !== undefined)
        note.notes = dto.notes;
      if (dto.status !== undefined)
        note.status = dto.status;

      // Sauvegarder les modifications du bon de livraison
      await manager.save(DeliveryNote, note);

      if (dto.items?.length) {
        // Supprimer TOUS les items existants avec SQL direct
        console.log('🔧 Tentative de suppression pour note ID:', id);
        
        const deleteResult = await manager.query(
          `DELETE FROM delivery_note_items WHERE "deliveryNoteId" = $1`,
          [id]
        );
        console.log('🔧 Items supprimés:', deleteResult[1], 'lignes');

        // Créer les nouveaux items
        const lines = dto.items.map((item) =>
          manager.create(DeliveryNoteItem, {
            ...item,
            deliveryNoteId: id,
          }),
        );
        console.log('🔧 Nouveaux items à créer:', lines.length);
        await manager.save(DeliveryNoteItem, lines);
        
        console.log('🔧 Items créés avec succès');
      }
    });

    // Récupérer les données fraîches APRÈS la transaction
    const result = await this.findOne(businessId, id);
    console.log('🔧 Résultat final - items:', result?.items?.length);
    return result;
  }

  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BL-${year}-`;

    const result = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SUBSTRING("deliveryNoteNumber" FROM ${prefix.length + 1}) AS INTEGER)),
        0
      ) + 1 AS next_seq
      FROM delivery_notes
      WHERE "businessId" = $1
        AND "deliveryNoteNumber" LIKE $2`,
      [businessId, `${prefix}%`],
    );

    const seq = String(result[0]?.next_seq ?? 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  async markDelivered(businessId: string, id: string): Promise<DeliveryNote> {
    const note = await this.findOne(businessId, id);
    
    // Vérifier que toutes les lignes ont une quantité livrée > 0
    const hasZeroQuantity = note.items?.some(item => Number(item.deliveredQuantity) === 0);
    if (hasZeroQuantity) {
      throw new Error('Impossible de marquer comme livré : certaines lignes ont une quantité livrée de 0. Veuillez modifier le bon de livraison.');
    }
    
    return this.dataSource.transaction(async (manager) => {
      // Mark delivery note as delivered
      note.status = 'delivered';
      await manager.save(DeliveryNote, note);
      
      // If linked to a sales order, mark the order as delivered too
      if (note.salesOrderId) {
        const salesOrder = await manager.findOne(SalesOrder, {
          where: { id: note.salesOrderId, businessId },
        });
        
        if (salesOrder && salesOrder.status === SalesOrderStatus.IN_PROGRESS) {
          salesOrder.status = SalesOrderStatus.DELIVERED;
          salesOrder.deliveryDate = new Date();
          await manager.save(SalesOrder, salesOrder);
        }
      }
      
      return this.findOne(businessId, id);
    });
  }

  async cancel(businessId: string, id: string): Promise<DeliveryNote> {
    const note = await this.findOne(businessId, id);
    note.status = 'cancelled';
    await this.noteRepo.save(note);
    return this.findOne(businessId, id);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const note = await this.findOne(businessId, id);
    
    return this.dataSource.transaction(async (manager) => {
      // Delete delivery note items first
      await manager.delete(DeliveryNoteItem, { deliveryNoteId: id });
      
      // Then delete the delivery note
      await manager.delete(DeliveryNote, { id, businessId });
    });
  }

  async cleanDuplicates(businessId: string, id: string): Promise<DeliveryNote> {
    const note = await this.findOne(businessId, id);
    
    return this.dataSource.transaction(async (manager) => {
      // Grouper les items par description et garder seulement le dernier
      const itemsMap = new Map<string, any>();
      
      for (const item of note.items || []) {
        const key = `${item.description}-${item.salesOrderItemId || 'no-order'}`;
        // Garder l'item avec la quantité livrée la plus élevée
        const existing = itemsMap.get(key);
        if (!existing || Number(item.deliveredQuantity) > Number(existing.deliveredQuantity)) {
          itemsMap.set(key, item);
        }
      }
      
      // Supprimer tous les items
      await manager.delete(DeliveryNoteItem, { deliveryNoteId: id });
      
      // Recréer uniquement les items uniques
      const uniqueItems = Array.from(itemsMap.values()).map(item => 
        manager.create(DeliveryNoteItem, {
          deliveryNoteId: id,
          productId: item.productId,
          salesOrderItemId: item.salesOrderItemId,
          description: item.description,
          quantity: item.quantity,
          deliveredQuantity: item.deliveredQuantity,
        })
      );
      
      await manager.save(DeliveryNoteItem, uniqueItems);
      
      return this.findOne(businessId, id);
    });
  }
}
