// src/sales/services/sales-email-ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailDraftParams {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  isReminder: boolean;
  language?: 'fr' | 'ar';
}

export interface EmailDraftResult {
  subject: string;
  body: string;
}

@Injectable()
export class SalesEmailAiService {
  private readonly logger = new Logger(SalesEmailAiService.name);
  private readonly apiKey: string | null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || null;
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY non configurée — génération email AI désactivée');
    } else {
      this.logger.log('Service email AI initialisé avec API REST v1 (gemini-2.5-flash)');
    }
  }

  async generateEmailDraft(params: EmailDraftParams): Promise<EmailDraftResult> {
    if (!this.apiKey) {
      return this.getFallbackEmailDraft(params);
    }

    try {
      const lang = params.language === 'ar' ? 'arabe' : 'français';
      const type = params.isReminder 
        ? 'rappel de paiement (facture en retard)' 
        : 'envoi initial de facture';

      const prompt = `
Rédige un email professionnel en ${lang} pour un ${type}.
Ton: professionnel mais chaleureux. Longueur: 3-4 phrases max.

Informations:
- Client: ${params.clientName}
- Facture n°: ${params.invoiceNumber}
- Montant: ${params.amount.toFixed(3)} TND
- Échéance: ${params.dueDate}
- Type: ${params.isReminder ? 'RAPPEL — facture en retard' : 'PREMIER ENVOI'}

Retourne UNIQUEMENT ce JSON (sans backticks):
{
  "subject": "Objet de l'email",
  "body": "Corps complet de l'email avec salutation et signature."
}
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      this.logger.log(`Email draft généré pour facture ${params.invoiceNumber} en ${lang}`);

      return {
        subject: parsed.subject || 'Facture',
        body: parsed.body || '',
      };
    } catch (error: any) {
      this.logger.error(`Erreur génération email draft: ${error.message}`);
      return this.getFallbackEmailDraft(params);
    }
  }

  private getFallbackEmailDraft(params: EmailDraftParams): EmailDraftResult {
    const lang = params.language === 'ar' ? 'ar' : 'fr';
    
    if (params.isReminder) {
      if (lang === 'ar') {
        return {
          subject: `تذكير بالدفع - فاتورة ${params.invoiceNumber}`,
          body: `السيد/السيدة ${params.clientName}،\n\nنود تذكيركم بأن الفاتورة رقم ${params.invoiceNumber} بمبلغ ${params.amount.toFixed(3)} دينار تونسي لم يتم دفعها بعد. تاريخ الاستحقاق كان ${params.dueDate}.\n\nنرجو منكم تسوية هذا المبلغ في أقرب وقت ممكن.\n\nمع خالص الشكر والتقدير.`,
        };
      } else {
        return {
          subject: `Rappel de paiement - Facture ${params.invoiceNumber}`,
          body: `Bonjour ${params.clientName},\n\nNous vous rappelons que la facture n° ${params.invoiceNumber} d'un montant de ${params.amount.toFixed(3)} TND n'a pas encore été réglée. La date d'échéance était le ${params.dueDate}.\n\nNous vous remercions de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nCordialement.`,
        };
      }
    } else {
      if (lang === 'ar') {
        return {
          subject: `فاتورة ${params.invoiceNumber} - ${params.clientName}`,
          body: `السيد/السيدة ${params.clientName}،\n\nيسرنا أن نرسل لكم الفاتورة رقم ${params.invoiceNumber} بمبلغ ${params.amount.toFixed(3)} دينار تونسي. تاريخ الاستحقاق هو ${params.dueDate}.\n\nستجدون الفاتورة مرفقة بهذا البريد الإلكتروني.\n\nمع خالص الشكر والتقدير.`,
        };
      } else {
        return {
          subject: `Facture ${params.invoiceNumber} - ${params.clientName}`,
          body: `Bonjour ${params.clientName},\n\nVeuillez trouver ci-joint la facture n° ${params.invoiceNumber} d'un montant de ${params.amount.toFixed(3)} TND. La date d'échéance est fixée au ${params.dueDate}.\n\nNous restons à votre disposition pour toute question.\n\nCordialement.`,
        };
      }
    }
  }
}
