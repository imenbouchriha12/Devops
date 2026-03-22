import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quote } from '../entities/quote.entity';
import { QuoteItem } from '../entities/quote-item.entity';
import { QuoteStatus } from '../entities/quote.entity';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT],
  [QuoteStatus.SENT]: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [QuoteStatus.CONVERTED],
  [QuoteStatus.REJECTED]: [],
  [QuoteStatus.EXPIRED]: [],
  [QuoteStatus.CONVERTED]: [],
};

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,

    @InjectRepository(QuoteItem)
    private readonly itemRepo: Repository<QuoteItem>,

    private readonly dataSource: DataSource,
  ) {}

  async create(businessId: string, dto: CreateQuoteDto): Promise<Quote> {
    return this.dataSource.transaction(async (manager) => {
      const quoteNumber = await this.generateNumber(businessId, manager);
      const { items: itemsDto, ...rest } = dto;
      const { subtotal, taxAmount, netAmount, items } = this.calcTotals(itemsDto);

      const quote = manager.create(Quote, {
        ...rest,
        quoteNumber,
        businessId,
        status: QuoteStatus.DRAFT,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        timbreFiscal: 1.000,
        netAmount,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      });
      const saved = await manager.save(Quote, quote);

      const lines = items.map((item, i) =>
        manager.create(QuoteItem, {
          ...item,
          quoteId: saved.id,
        }),
      );
      await manager.save(QuoteItem, lines);

      return manager.findOne(Quote, {
        where: { id: saved.id },
        relations: ['items', 'client'],
      }) as Promise<Quote>;
    });
  }

  async findAll(businessId: string, query: any) {
    const { client_id, status, page = 1, limit = 20 } = query;

    const qb = this.quoteRepo
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.client', 'client')
      .where('quote.businessId = :businessId', { businessId })
      .orderBy('quote.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim());
      qb.andWhere('quote.status IN (:...statuses)', { statuses });
    }
    if (client_id) qb.andWhere('quote.clientId = :client_id', { client_id });

    const [data, total] = await qb.getManyAndCount();
    const total_pages = Math.ceil(total / limit);
    return { data, total, page, limit, total_pages };
  }

  async findOne(businessId: string, id: string): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id, businessId },
      relations: ['items', 'client'],
    });
    if (!quote) throw new NotFoundException(`Devis introuvable (id: ${id})`);
    return quote;
  }

  async update(businessId: string, id: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findOne(businessId, id);

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Modification impossible. Statut actuel : ${quote.status}. Requis : DRAFT.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Update basic fields
      if (dto.clientId !== undefined) quote.clientId = dto.clientId;
      if (dto.quoteDate !== undefined) {
        quote.quoteDate = dto.quoteDate ? new Date(dto.quoteDate) : new Date();
      }
      if (dto.validUntil !== undefined) {
        quote.validUntil = dto.validUntil ? new Date(dto.validUntil) : undefined as any;
      }
      if (dto.notes !== undefined) quote.notes = dto.notes;

      if (dto.items?.length) {
        await manager.delete(QuoteItem, { quoteId: id });

        const { subtotal, taxAmount, netAmount, items } = this.calcTotals(dto.items);
        quote.subtotal = subtotal;
        quote.taxAmount = taxAmount;
        quote.total = subtotal + taxAmount;
        quote.netAmount = netAmount;

        await manager.save(Quote, quote);

        const lines = items.map((item) =>
          manager.create(QuoteItem, {
            ...item,
            quoteId: id,
          }),
        );
        await manager.save(QuoteItem, lines);
      } else {
        await manager.save(Quote, quote);
      }

      return manager.findOne(Quote, {
        where: { id },
        relations: ['items', 'client'],
      }) as Promise<Quote>;
    });
  }

  async send(businessId: string, id: string) {
    return this.transition(businessId, id, QuoteStatus.SENT, (q) => {
      q.sentAt = new Date();
    });
  }

  async accept(businessId: string, id: string) {
    return this.transition(businessId, id, QuoteStatus.ACCEPTED);
  }

  async reject(businessId: string, id: string) {
    return this.transition(businessId, id, QuoteStatus.REJECTED);
  }

  async expire(businessId: string, id: string) {
    return this.transition(businessId, id, QuoteStatus.EXPIRED);
  }

  async convert(businessId: string, id: string) {
    return this.transition(businessId, id, QuoteStatus.CONVERTED);
  }

  private async transition(
    businessId: string,
    id: string,
    target: QuoteStatus,
    mutate?: (quote: Quote) => void,
  ): Promise<Quote> {
    const quote = await this.findOne(businessId, id);
    const allowed = TRANSITIONS[quote.status];

    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Transition invalide : ${quote.status} → ${target}. ` +
        `Autorisées : ${allowed.join(', ') || 'aucune (statut terminal)'}`,
      );
    }

    quote.status = target;
    if (mutate) mutate(quote);
    await this.quoteRepo.save(quote);
    return this.findOne(businessId, id);
  }

  private calcTotals(itemsDto: CreateQuoteDto['items']) {
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
    const prefix = `DEV-${year}-`;

    const result = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SUBSTRING("quoteNumber" FROM ${prefix.length + 1}) AS INTEGER)),
        0
      ) + 1 AS next_seq
      FROM quotes
      WHERE "businessId" = $1
        AND "quoteNumber" LIKE $2`,
      [businessId, `${prefix}%`],
    );

    const seq = String(result[0]?.next_seq ?? 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }

  async delete(businessId: string, id: string): Promise<void> {
    const quote = await this.findOne(businessId, id);
    
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Suppression impossible. Seuls les devis en brouillon peuvent être supprimés. Statut actuel : ${quote.status}`,
      );
    }

    await this.quoteRepo.delete({ id, businessId });
  }
}
