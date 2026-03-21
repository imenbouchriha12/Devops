import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { InvoiceStatus }   from '../enum/invoice-status.enum';
import { SuppliersService } from './suppliers.service';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { DisputePurchaseInvoiceDto, UpdatePaymentAmountDto, UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';


@Injectable()
export class PurchaseInvoicesService {

  private readonly logger = new Logger(PurchaseInvoicesService.name);

  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly repo: Repository<PurchaseInvoice>,

    private readonly suppliersService: SuppliersService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────
  async create(businessId: string, dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    const supplier = await this.suppliersService.findOneOrFail(businessId, dto.supplier_id);

    const timbre  = dto.timbre_fiscal ?? 1.000;
    const net     = this.round(dto.subtotal_ht + dto.tax_amount + timbre);

    if (dto.net_amount !== undefined && Math.abs(dto.net_amount - net) > 0.005) {
      throw new BadRequestException(
        `Montants incohérents : ${dto.subtotal_ht} + ${dto.tax_amount} + ${timbre} = ${net} DT` +
        ` mais net_amount fourni = ${dto.net_amount} DT.`,
      );
    }

    const invoiceDate = new Date(dto.invoice_date);
    const dueDate     = dto.due_date
      ? new Date(dto.due_date)
      : this.addDays(invoiceDate, supplier.payment_terms);

    return this.repo.save(this.repo.create({
      ...dto,
      business_id:   businessId,
      invoice_date:  invoiceDate,
      due_date:      dueDate,
      timbre_fiscal: timbre,
      net_amount:    net,
      paid_amount:   0,
      status:        InvoiceStatus.PENDING,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────────────────────────
  async findAll(businessId: string, query: any) {
    const { supplier_id, status, due_before, date_from, date_to, page = 1, limit = 20 } = query;

    const qb = this.repo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.supplier', 'supplier')
      .where('inv.business_id = :businessId', { businessId })
      .orderBy('inv.due_date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim());
      qb.andWhere('inv.status IN (:...statuses)', { statuses });
    }
    if (supplier_id) qb.andWhere('inv.supplier_id = :supplier_id', { supplier_id });
    if (due_before)  qb.andWhere('inv.due_date <= :due_before', { due_before });
    if (date_from)   qb.andWhere('inv.invoice_date >= :date_from', { date_from });
    if (date_to)     qb.andWhere('inv.invoice_date <= :date_to', { date_to });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────
  async findOne(businessId: string, id: string): Promise<PurchaseInvoice> {
    const inv = await this.repo.findOne({
      where:     { id, business_id: businessId },
      relations: ['supplier', 'supplier_po'],
    });
    if (!inv) throw new NotFoundException(`Facture fournisseur introuvable (id: ${id})`);
    return inv;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE — PENDING seulement
  // ─────────────────────────────────────────────────────────────
  async update(businessId: string, id: string, dto: UpdatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    const inv = await this.findOne(businessId, id);

    if (inv.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `Modification impossible. Statut : ${inv.status}. Requis : PENDING.`,
      );
    }

    const subtotal_ht = dto.subtotal_ht   ?? inv.subtotal_ht;
    const tax_amount  = dto.tax_amount    ?? inv.tax_amount;
    const timbre      = dto.timbre_fiscal ?? inv.timbre_fiscal;
    const net_amount  = this.round(subtotal_ht + tax_amount + timbre);

    let due_date = inv.due_date;
    if (dto.invoice_date && !dto.due_date) {
      const supplier = await this.suppliersService.findOneOrFail(businessId, inv.supplier_id);
      due_date = this.addDays(new Date(dto.invoice_date), supplier.payment_terms);
    } else if (dto.due_date) {
      due_date = new Date(dto.due_date);
    }

    Object.assign(inv, {
      ...dto,
      invoice_date:  dto.invoice_date ? new Date(dto.invoice_date) : inv.invoice_date,
      due_date,
      subtotal_ht,
      tax_amount,
      timbre_fiscal: timbre,
      net_amount,
    });

    return this.repo.save(inv);
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVE — PENDING → APPROVED
  // ─────────────────────────────────────────────────────────────
  async approve(businessId: string, id: string): Promise<PurchaseInvoice> {
    const inv = await this.findOne(businessId, id);

    if (inv.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `Approbation impossible. Statut : ${inv.status}. Requis : PENDING.`,
      );
    }

    inv.status = InvoiceStatus.APPROVED;
    return this.repo.save(inv);
  }

  // ─────────────────────────────────────────────────────────────
  // DISPUTE
  // ─────────────────────────────────────────────────────────────
  async dispute(businessId: string, id: string, dto: DisputePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    const inv = await this.findOne(businessId, id);

    if (inv.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Impossible de mettre en litige une facture déjà payée.');
    }

    inv.status         = InvoiceStatus.DISPUTED;
    inv.dispute_reason = dto.dispute_reason;
    return this.repo.save(inv);
  }

  // ─────────────────────────────────────────────────────────────
  // RESOLVE DISPUTE — DISPUTED → APPROVED
  // ─────────────────────────────────────────────────────────────
  async resolveDispute(businessId: string, id: string): Promise<PurchaseInvoice> {
    const inv = await this.findOne(businessId, id);

    if (inv.status !== InvoiceStatus.DISPUTED) {
      throw new BadRequestException('Cette facture n\'est pas en litige.');
    }

    inv.status         = InvoiceStatus.APPROVED;
    inv.dispute_reason = null;
    return this.repo.save(inv);
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE PAYMENT — appelé par Module 5 (Trésorerie)
  // ─────────────────────────────────────────────────────────────
  async updatePayment(businessId: string, id: string, dto: UpdatePaymentAmountDto): Promise<PurchaseInvoice> {
    const inv = await this.findOne(businessId, id);

    if (inv.status === InvoiceStatus.DISPUTED) {
      throw new BadRequestException('Paiement bloqué : facture en litige.');
    }

    if (dto.paid_amount > Number(inv.net_amount) + 0.005) {
      throw new BadRequestException(
        `Paiement (${dto.paid_amount} DT) > net_amount (${inv.net_amount} DT).`,
      );
    }

    inv.paid_amount = this.round(dto.paid_amount);

    if (inv.paid_amount >= Number(inv.net_amount) - 0.005) {
      inv.status = InvoiceStatus.PAID;
    } else if (inv.paid_amount > 0) {
      inv.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return this.repo.save(inv);
  }

  // ─────────────────────────────────────────────────────────────
  // CRON — chaque nuit à 1h, passe les factures échues à OVERDUE
  // ─────────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.repo
      .createQueryBuilder()
      .update(PurchaseInvoice)
      .set({ status: InvoiceStatus.OVERDUE })
      .where('due_date < :today', { today })
      .andWhere('status IN (:...statuses)', {
        statuses: [
          InvoiceStatus.PENDING,
          InvoiceStatus.APPROVED,
          InvoiceStatus.PARTIALLY_PAID,
        ],
      })
      .execute();

        if ((result.affected ?? 0) > 0) {
        this.logger.log(`Cron OVERDUE : ${result.affected} facture(s) passée(s) en OVERDUE.`);
        }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}