// src/Purchases/services/supplier-payments.service.ts
import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplierPayment }    from '../entities/supplier-payment.entity';
import { PurchaseInvoice }    from '../entities/purchase-invoice.entity';
import { InvoiceStatus }      from '../enum/invoice-status.enum';
import { SuppliersService }   from './suppliers.service';
import { CreateSupplierPaymentDto, QuerySupplierPaymentsDto } from '../dto/supplier-payment.dto';

@Injectable()
export class SupplierPaymentsService {

  private readonly logger = new Logger(SupplierPaymentsService.name);

  constructor(
    @InjectRepository(SupplierPayment)
    private readonly paymentRepo: Repository<SupplierPayment>,

    @InjectRepository(PurchaseInvoice)
    private readonly invoiceRepo: Repository<PurchaseInvoice>,

    private readonly suppliersService: SuppliersService,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────
  async create(
    businessId: string,
    dto: CreateSupplierPaymentDto,
    userId: string,
  ): Promise<SupplierPayment> {

    // Vérifier que le fournisseur existe
    await this.suppliersService.findOneOrFail(businessId, dto.supplier_id);

    // Si lié à une facture → vérifier cohérence
    let invoice: PurchaseInvoice | null = null;
    if (dto.purchase_invoice_id) {
      invoice = await this.invoiceRepo.findOne({
        where: { id: dto.purchase_invoice_id, business_id: businessId },
      });
      if (!invoice) {
        throw new NotFoundException(`Facture introuvable (id: ${dto.purchase_invoice_id})`);
      }
      if (invoice.supplier_id !== dto.supplier_id) {
        throw new BadRequestException(
          `La facture ${invoice.invoice_number_supplier} n'appartient pas au fournisseur sélectionné.`,
        );
      }
      const payable = [
        InvoiceStatus.APPROVED,
        InvoiceStatus.PARTIALLY_PAID,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.DISPUTED,
      ];
      if (!payable.includes(invoice.status)) {
        throw new BadRequestException(
          `Facture en statut "${invoice.status}" — non payable. ` +
          `Requis : APPROVED, PARTIALLY_PAID, OVERDUE ou DISPUTED.`,
        );
      }
      const remaining = this.round(Number(invoice.net_amount) - Number(invoice.paid_amount));
      if (dto.amount > remaining + 0.005) {
        throw new BadRequestException(
          `Montant (${dto.amount}) supérieur au reste à payer (${remaining}).`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const payment_number = await this.generateNumber(businessId, manager);

      const payment = manager.create(SupplierPayment, {
        ...dto,
        payment_number,
        business_id: businessId,
        payment_date: new Date(dto.payment_date),
        created_by:  userId,
      });
      const saved = await manager.save(SupplierPayment, payment);

      // Si lié à une facture → mettre à jour paid_amount + statut
      if (invoice) {
        const newPaid = this.round(Number(invoice.paid_amount) + dto.amount);
        invoice.paid_amount = newPaid;

        if (newPaid >= Number(invoice.net_amount) - 0.005) {
          invoice.status = InvoiceStatus.PAID;
        } else {
          invoice.status = InvoiceStatus.PARTIALLY_PAID;
        }
        await manager.save(PurchaseInvoice, invoice);
      }

      return manager.findOne(SupplierPayment, {
        where:     { id: saved.id },
        relations: ['supplier', 'purchase_invoice'],
      }) as Promise<SupplierPayment>;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────
  async findAll(businessId: string, query: QuerySupplierPaymentsDto) {
    const { supplier_id, purchase_invoice_id, payment_method, date_from, date_to, page = 1, limit = 20 } = query;

    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.purchase_invoice', 'invoice')
      .where('p.business_id = :businessId', { businessId })
      .orderBy('p.payment_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (supplier_id)         qb.andWhere('p.supplier_id = :supplier_id', { supplier_id });
    if (purchase_invoice_id) qb.andWhere('p.purchase_invoice_id = :purchase_invoice_id', { purchase_invoice_id });
    if (payment_method)      qb.andWhere('p.payment_method = :payment_method', { payment_method });
    if (date_from)           qb.andWhere('p.payment_date >= :date_from', { date_from });
    if (date_to)             qb.andWhere('p.payment_date <= :date_to', { date_to });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async findOne(businessId: string, id: string): Promise<SupplierPayment> {
    const p = await this.paymentRepo.findOne({
      where:     { id, business_id: businessId },
      relations: ['supplier', 'purchase_invoice'],
    });
    if (!p) throw new NotFoundException(`Paiement introuvable (id: ${id})`);
    return p;
  }

  // Statistiques : total payé à un fournisseur
  async getSupplierStats(businessId: string, supplierId: string) {
    const result = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total_paid')
      .addSelect('COUNT(p.id)', 'payment_count')
      .where('p.business_id = :businessId AND p.supplier_id = :supplierId', {
        businessId, supplierId,
      })
      .getRawOne();
    return {
      total_paid:    Number(result.total_paid)    || 0,
      payment_count: Number(result.payment_count) || 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVÉ
  // ─────────────────────────────────────────────────────────────────
  private async generateNumber(businessId: string, manager: any): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    const result = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SUBSTRING(payment_number FROM ${prefix.length + 1}) AS INTEGER)),
        0
      ) + 1 AS next_seq
      FROM supplier_payments
      WHERE business_id = $1 AND payment_number LIKE $2`,
      [businessId, `${prefix}%`],
    );
    const seq = String(result[0]?.next_seq ?? 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }
}