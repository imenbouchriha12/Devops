// src/sales/services/sales-matching.service.ts
//
// Rapprochement 4 voies : Devis ↔ Commande ↔ Bon de livraison ↔ Facture
//
// Logique :
// 1. Vérifier que la facture correspond à une commande existante
// 2. Vérifier que les marchandises ont bien été livrées (BL)
// 3. Vérifier que les montants facturés correspondent aux montants commandés
// 4. Vérifier la cohérence avec le devis initial si existant

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invoice } from '../entities/invoice.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { DeliveryNoteItem } from '../entities/delivery-note-item.entity';
import { Quote } from '../entities/quote.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { SalesOrderStatus } from '../entities/sales-order.entity';

// ─── Types résultat ──────────────────────────────────────────────────────────

export enum SalesMatchStatus {
  MATCHED = 'MATCHED', // Tout correspond
  PARTIAL_MATCH = 'PARTIAL_MATCH', // Écarts mineurs
  MISMATCH = 'MISMATCH', // Écarts significatifs
  MISSING_ORDER = 'MISSING_ORDER', // Pas de commande associée
  MISSING_DELIVERY = 'MISSING_DELIVERY', // Pas de bon de livraison
  OVER_INVOICED = 'OVER_INVOICED', // Facturé plus que livré
  UNDER_INVOICED = 'UNDER_INVOICED', // Facturé moins que livré
}

export interface SalesLineDiscrepancy {
  description: string;
  order_quantity: number;
  delivered_quantity: number;
  invoiced_quantity: number;
  order_unit_price: number;
  order_line_total: number;
  delivered_total: number;
  discrepancy_amount: number;
  discrepancy_pct: number;
  status: 'OK' | 'PRICE_MISMATCH' | 'QTY_MISMATCH' | 'NOT_DELIVERED' | 'OVER_INVOICED';
}

export interface SalesMatchResult {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  status: SalesMatchStatus;
  can_auto_validate: boolean;
  should_alert: boolean;

  // Comparaison des totaux
  quote_total: number | null;
  order_total: number;
  delivered_total: number;
  invoiced_total: number;
  total_discrepancy: number;
  discrepancy_pct: number;

  // Détail par ligne
  line_discrepancies: SalesLineDiscrepancy[];

  // Résumé
  issues: string[];
  recommendations: string[];

  // Données sources
  quote_number: string | null;
  order_number: string | null;
  delivery_note_numbers: string[];
  matching_date: Date;
}

const TOLERANCE_PCT = 0.5; // 0.5% de tolérance acceptable

@Injectable()
export class SalesMatchingService {
  private readonly logger = new Logger(SalesMatchingService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,

    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,

    @InjectRepository(SalesOrderItem)
    private readonly orderItemRepo: Repository<SalesOrderItem>,

    @InjectRepository(DeliveryNote)
    private readonly deliveryNoteRepo: Repository<DeliveryNote>,

    @InjectRepository(DeliveryNoteItem)
    private readonly deliveryNoteItemRepo: Repository<DeliveryNoteItem>,

    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Effectuer le rapprochement sur une facture
  // ─────────────────────────────────────────────────────────────────────────
  async matchInvoice(
    businessId: string,
    invoiceId: string,
    autoAction: boolean = false,
  ): Promise<SalesMatchResult> {
    // 1. Charger la facture
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, business_id: businessId },
      relations: ['client', 'items'],
    });
    if (!invoice) throw new NotFoundException(`Facture introuvable (id: ${invoiceId})`);

    const issues: string[] = [];
    const recommendations: string[] = [];
    const lineDiscrepancies: SalesLineDiscrepancy[] = [];

    // 2. Vérifier si une commande est associée
    if (!invoice.sales_order_id) {
      const result = this.buildResult(invoice, null, null, [], {
        status: SalesMatchStatus.MISSING_ORDER,
        can_auto_validate: false,
        should_alert: false,
        quote_total: null,
        order_total: 0,
        delivered_total: 0,
        invoiced_total: Number(invoice.net_amount),
        total_discrepancy: Number(invoice.net_amount),
        discrepancy_pct: 100,
        line_discrepancies: [],
        issues: ['Aucune commande client associée à cette facture.'],
        recommendations: ['Associez cette facture à une commande existante pour effectuer le rapprochement.'],
        delivery_note_numbers: [],
      });

      return result;
    }

    // 3. Charger la commande et ses lignes
    const order = await this.orderRepo.findOne({
      where: { id: invoice.sales_order_id, businessId },
      relations: ['items', 'client'],
    });
    if (!order) {
      issues.push('Commande associée introuvable en base de données.');
      return this.buildResult(invoice, null, null, [], {
        status: SalesMatchStatus.MISSING_ORDER,
        can_auto_validate: false,
        should_alert: true,
        quote_total: null,
        order_total: 0,
        delivered_total: 0,
        invoiced_total: Number(invoice.net_amount),
        total_discrepancy: Number(invoice.net_amount),
        discrepancy_pct: 100,
        line_discrepancies: [],
        issues,
        recommendations: [],
        delivery_note_numbers: [],
      });
    }

    // 4. Charger le devis si existant
    let quote: Quote | null = null;
    if (order.quoteId) {
      quote = await this.quoteRepo.findOne({
        where: { id: order.quoteId, businessId },
        relations: ['items'],
      });
    }

    // 5. Charger les bons de livraison
    this.logger.debug(`Recherche BL pour commande ${order.id} (orderNumber: ${order.orderNumber})`);
    
    const deliveryNotes = await this.deliveryNoteRepo.find({
      where: { salesOrderId: order.id, businessId: businessId },
      relations: ['items'],
    });

    this.logger.debug(`Facture ${invoice.invoice_number}: ${deliveryNotes.length} bons de livraison trouvés pour commande ${order.id}`);
    
    if (deliveryNotes.length > 0) {
      deliveryNotes.forEach(dn => {
        this.logger.debug(`  BL ${dn.deliveryNoteNumber}: salesOrderId=${dn.salesOrderId}, items count=${dn.items?.length ?? 0}`);
      });
    }
    
    const deliveryNoteNumbers = deliveryNotes.map((dn) => dn.deliveryNoteNumber);

    if (deliveryNotes.length === 0) {
      issues.push('Aucun bon de livraison trouvé pour cette commande.');
      recommendations.push('Créez un bon de livraison avant de valider cette facture.');
    }

    // 6. Calculer les quantités livrées par ligne de commande
    // On essaie d'abord par salesOrderItemId, sinon on match par description
    const deliveredByOrderItem = new Map<string, number>();
    const deliveredByDescription = new Map<string, number>();
    
    for (const dn of deliveryNotes) {
      this.logger.debug(`BL ${dn.deliveryNoteNumber}: ${dn.items?.length ?? 0} lignes`);
      for (const dnItem of dn.items ?? []) {
        this.logger.debug(`  - ${dnItem.description}: qté=${dnItem.deliveredQuantity}, salesOrderItemId=${dnItem.salesOrderItemId}`);
        
        // Méthode 1: Par ID de ligne de commande (si disponible)
        if (dnItem.salesOrderItemId) {
          const current = deliveredByOrderItem.get(dnItem.salesOrderItemId) ?? 0;
          deliveredByOrderItem.set(
            dnItem.salesOrderItemId,
            current + Number(dnItem.deliveredQuantity),
          );
        }
        
        // Méthode 2: Par description (fallback)
        const desc = dnItem.description?.trim().toLowerCase();
        if (desc) {
          const current = deliveredByDescription.get(desc) ?? 0;
          deliveredByDescription.set(desc, current + Number(dnItem.deliveredQuantity));
        }
      }
    }
    
    this.logger.debug(`Quantités livrées par ID: ${JSON.stringify(Array.from(deliveredByOrderItem.entries()))}`);
    this.logger.debug(`Quantités livrées par description: ${JSON.stringify(Array.from(deliveredByDescription.entries()))}`);


    // 7. Comparer ligne par ligne
    let orderTotal = 0;
    let deliveredTotal = 0;

    this.logger.debug(`Commande ${order.orderNumber}: ${order.items?.length ?? 0} lignes`);
    
    for (const orderItem of order.items ?? []) {
      const qtyOrdered = Number(orderItem.quantity);
      
      // Essayer d'abord par ID, sinon par description
      let qtyDelivered = deliveredByOrderItem.get(orderItem.id) ?? 0;
      if (qtyDelivered === 0) {
        const desc = orderItem.description?.trim().toLowerCase();
        qtyDelivered = desc ? (deliveredByDescription.get(desc) ?? 0) : 0;
      }
      
      this.logger.debug(`Ligne commande "${orderItem.description}" (id: ${orderItem.id}): commandé=${qtyOrdered}, livré=${qtyDelivered}`);
      const unitPrice = Number(orderItem.unitPrice);
      const taxRate = Number(orderItem.taxRate) / 100;

      // Calculer les montants TTC (avec taxe) pour comparaison avec invoice.net_amount
      const orderLineTotal = this.round(qtyOrdered * unitPrice * (1 + taxRate));
      const deliveredLineTotal = this.round(qtyDelivered * unitPrice * (1 + taxRate));

      orderTotal += orderLineTotal;
      deliveredTotal += deliveredLineTotal;

      const discrepancyAmt = this.round(deliveredLineTotal - orderLineTotal);
      const discrepancyPct =
        orderLineTotal > 0 ? Math.abs(discrepancyAmt / orderLineTotal) * 100 : 0;

      let lineStatus: SalesLineDiscrepancy['status'] = 'OK';

      if (qtyDelivered === 0) {
        lineStatus = 'NOT_DELIVERED';
        issues.push(`"${orderItem.description}" : commandé mais pas encore livré.`);
      } else if (qtyDelivered > qtyOrdered) {
        lineStatus = 'OVER_INVOICED';
        issues.push(
          `"${orderItem.description}" : livré plus que commandé (${qtyDelivered} > ${qtyOrdered}).`,
        );
      } else if (qtyDelivered < qtyOrdered && Math.abs(discrepancyAmt) > 0.005) {
        lineStatus = 'OK';
      } else if (discrepancyPct > TOLERANCE_PCT) {
        lineStatus = 'QTY_MISMATCH';
        issues.push(
          `"${orderItem.description}" : écart de quantité (commandé ${qtyOrdered}, livré ${qtyDelivered}).`,
        );
      }

      lineDiscrepancies.push({
        description: orderItem.description,
        order_quantity: qtyOrdered,
        delivered_quantity: qtyDelivered,
        invoiced_quantity: qtyOrdered,
        order_unit_price: unitPrice,
        order_line_total: orderLineTotal,
        delivered_total: deliveredLineTotal,
        discrepancy_amount: discrepancyAmt,
        discrepancy_pct: this.round(discrepancyPct),
        status: lineStatus,
      });
    }

    orderTotal = this.round(orderTotal);
    deliveredTotal = this.round(deliveredTotal);
    
    // Add timbre fiscal (1.000 TND) to get NET TTC
    const timbreFiscal = 1.000;
    orderTotal = this.round(orderTotal + timbreFiscal);
    deliveredTotal = this.round(deliveredTotal + timbreFiscal);
    
    const invoicedTotal = Number(invoice.net_amount); // Use net_amount (TTC with stamp)
    const totalDiscrep = this.round(invoicedTotal - deliveredTotal);
    const discrepancyPct =
      deliveredTotal > 0 ? this.round(Math.abs(totalDiscrep / deliveredTotal) * 100) : 100;

    // 8. Comparaison montant facturé vs montant livré
    if (Math.abs(totalDiscrep) > 0.005) {
      if (invoicedTotal > deliveredTotal) {
        issues.push(
          `Montant facturé (${invoicedTotal.toFixed(3)} TND) supérieur au montant livré (${deliveredTotal.toFixed(3)} TND). Écart : ${Math.abs(totalDiscrep).toFixed(3)} TND.`,
        );
      } else {
        recommendations.push(
          `Montant facturé inférieur au montant livré. Vérifier si c'est une remise ou un avoir.`,
        );
      }
    }

    // 9. Déterminer le statut global
    const hasNotDelivered = lineDiscrepancies.some((l) => l.status === 'NOT_DELIVERED');
    const hasOverInvoiced = lineDiscrepancies.some((l) => l.status === 'OVER_INVOICED');
    const hasQtyMismatch = lineDiscrepancies.some((l) => l.status === 'QTY_MISMATCH');
    const allOk = lineDiscrepancies.every((l) => l.status === 'OK');
    const noDelivery = deliveryNotes.length === 0;

    let status: SalesMatchStatus;
    let canAutoValidate = false;
    let shouldAlert = false;

    if (noDelivery) {
      status = SalesMatchStatus.MISSING_DELIVERY;
      recommendations.push('Attendre la livraison des marchandises avant de valider.');
    } else if (hasOverInvoiced) {
      status = SalesMatchStatus.OVER_INVOICED;
      shouldAlert = true;
      recommendations.push('Alerte — montant facturé supérieur aux marchandises livrées.');
    } else if (invoicedTotal > deliveredTotal && discrepancyPct > TOLERANCE_PCT) {
      status = SalesMatchStatus.MISMATCH;
      shouldAlert = discrepancyPct > 5;
      recommendations.push(
        `Écart de ${discrepancyPct.toFixed(2)}% — la facture dépasse ce qui a été livré.`,
      );
    } else if (hasQtyMismatch) {
      status = SalesMatchStatus.MISMATCH;
      shouldAlert = discrepancyPct > 5;
      recommendations.push(`Écart de ${discrepancyPct.toFixed(2)}% — vérifier avec le client.`);
    } else if (discrepancyPct <= TOLERANCE_PCT) {
      status = allOk ? SalesMatchStatus.MATCHED : SalesMatchStatus.PARTIAL_MATCH;
      canAutoValidate = true;
      if (deliveredTotal < orderTotal) {
        recommendations.push(
          'Livraison partielle : la facture correspond à ce qui a été livré. Validation possible.',
        );
      } else {
        recommendations.push('Rapprochement validé — validation automatique possible.');
      }
    } else {
      status = SalesMatchStatus.PARTIAL_MATCH;
      recommendations.push('Vérification manuelle recommandée.');
    }

    const result = this.buildResult(invoice, quote, order, deliveryNotes, {
      status,
      can_auto_validate: canAutoValidate,
      should_alert: shouldAlert,
      quote_total: quote ? Number(quote.netAmount) : null, // TTC with stamp
      order_total: orderTotal,
      delivered_total: deliveredTotal,
      invoiced_total: invoicedTotal,
      total_discrepancy: totalDiscrep,
      discrepancy_pct: discrepancyPct,
      line_discrepancies: lineDiscrepancies,
      issues,
      recommendations,
      delivery_note_numbers: deliveryNoteNumbers,
    });

    this.logger.log(
      `Rapprochement ${invoice.invoice_number} : ${status} (écart ${discrepancyPct.toFixed(2)}%)`,
    );

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rapprochement de toutes les factures DRAFT d'un business
  // ─────────────────────────────────────────────────────────────────────────
  async matchAllDraft(businessId: string): Promise<SalesMatchResult[]> {
    const draftInvoices = await this.invoiceRepo.find({
      where: { business_id: businessId, status: InvoiceStatus.DRAFT },
    });

    const results: SalesMatchResult[] = [];
    for (const inv of draftInvoices) {
      try {
        const result = await this.matchInvoice(businessId, inv.id, false);
        results.push(result);
      } catch (err: any) {
        this.logger.error(`Erreur rapprochement facture ${inv.id} : ${err.message}`);
      }
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  private buildResult(
    invoice: Invoice,
    quote: Quote | null,
    order: SalesOrder | null,
    deliveryNotes: DeliveryNote[],
    data: Omit<
      SalesMatchResult,
      | 'invoice_id'
      | 'invoice_number'
      | 'client_name'
      | 'quote_number'
      | 'order_number'
      | 'delivery_note_numbers'
      | 'matching_date'
    > & { delivery_note_numbers: string[] },
  ): SalesMatchResult {
    const { delivery_note_numbers, ...rest } = data;
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_name: invoice.client?.name ?? '',
      quote_number: quote?.quoteNumber ?? null,
      order_number: order?.orderNumber ?? null,
      delivery_note_numbers,
      matching_date: new Date(),
      ...rest,
    };
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }
}
