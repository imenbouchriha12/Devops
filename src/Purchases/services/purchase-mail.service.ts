// src/Purchases/services/purchase-mail.service.ts
// Service d'email pour le module Purchases.
// Réutilise la config nodemailer déjà présente dans votre projet.
// Injectez ce service dans SupplierPOsService pour envoyer l'email à send().

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import * as nodemailer        from 'nodemailer';
import { SupplierPO }         from '../entities/supplier-po.entity';

@Injectable()
export class PurchaseMailService {

  private readonly logger     = new Logger(PurchaseMailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from:        string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('GMAIL_USER', 'no-reply@platform.tn');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.get<string>('GMAIL_USER'),
        pass: config.get<string>('GMAIL_PASS'),
      },
    });
  }

  // ─── Envoi BC au fournisseur ────────────────────────────────────────────
  async sendPurchaseOrder(po: SupplierPO): Promise<void> {
    const supplier = po.supplier;
    if (!supplier?.email) {
      this.logger.warn(
        `BC ${po.po_number} : fournisseur sans email — email non envoyé.`,
      );
      return;
    }

    const itemsHtml = (po.items ?? []).map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${Number(item.quantity_ordered).toFixed(3)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${Number(item.unit_price_ht).toFixed(3)} TND</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${item.tax_rate_value}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${Number(item.line_total_ht).toFixed(3)} TND</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#333;">

  <div style="background:#4F46E5;padding:24px 32px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Bon de Commande</h1>
    <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px;">${po.po_number}</p>
  </div>

  <div style="background:#F9FAFB;padding:24px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
    <p style="margin:0;">Bonjour <strong>${supplier.name}</strong>,</p>
    <p style="margin:12px 0 0;">
      Nous vous adressons notre bon de commande <strong>${po.po_number}</strong>.
      Merci de bien vouloir en prendre note et de nous confirmer votre accusé de réception.
    </p>
    ${po.expected_delivery ? `<p style="margin:8px 0 0;">Livraison souhaitée : <strong>${new Date(po.expected_delivery).toLocaleDateString('fr-TN')}</strong></p>` : ''}
  </div>

  <div style="padding:24px 32px;border:1px solid #E5E7EB;border-top:none;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#F3F4F6;">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6B7280;">Description</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;">Qté</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;">P.U. HT</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;">TVA</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;">Total HT</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top:16px;text-align:right;background:#F9FAFB;padding:12px 16px;border-radius:8px;">
      <table style="margin-left:auto;">
        <tr>
          <td style="padding:3px 16px;color:#6B7280;font-size:14px;">Sous-total HT</td>
          <td style="padding:3px 0;font-size:14px;font-weight:600;">${Number(po.subtotal_ht).toFixed(3)} TND</td>
        </tr>
        <tr>
          <td style="padding:3px 16px;color:#6B7280;font-size:14px;">TVA</td>
          <td style="padding:3px 0;font-size:14px;font-weight:600;">${Number(po.tax_amount).toFixed(3)} TND</td>
        </tr>
        <tr>
          <td style="padding:3px 16px;color:#6B7280;font-size:14px;">Timbre fiscal</td>
          <td style="padding:3px 0;font-size:14px;font-weight:600;">1.000 TND</td>
        </tr>
        <tr style="border-top:2px solid #E5E7EB;">
          <td style="padding:8px 16px;font-size:16px;font-weight:700;">Net TTC</td>
          <td style="padding:8px 0;font-size:16px;font-weight:700;color:#4F46E5;">${Number(po.net_amount).toFixed(3)} TND</td>
        </tr>
      </table>
    </div>

    ${po.notes ? `<div style="margin-top:16px;padding:12px 16px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;"><p style="margin:0;font-size:13px;color:#92400E;"><strong>Notes :</strong> ${po.notes}</p></div>` : ''}
  </div>

  <div style="padding:20px 32px;background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;font-size:12px;color:#9CA3AF;text-align:center;">
    Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
  </div>

</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from:    `"Achats" <${this.from}>`,
        to:      supplier.email,
        subject: `Bon de Commande ${po.po_number}`,
        html,
      });
      this.logger.log(`Email BC ${po.po_number} envoyé à ${supplier.email}`);
    } catch (err: any) {
      // Log sans throw — l'envoi email ne doit pas bloquer le changement de statut
      this.logger.error(
        `Échec envoi email BC ${po.po_number} à ${supplier.email} : ${err.message}`,
      );
    }
  }
}