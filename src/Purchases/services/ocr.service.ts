// src/Purchases/services/ocr.service.ts
//
// OCR avec Tesseract (local, gratuit, sans API externe)
// Installation requise :
//   npm install node-tesseract-ocr
//   Windows : choco install tesseract  (ou télécharger depuis https://github.com/UB-Mannheim/tesseract/wiki)
//   Ubuntu  : apt-get install tesseract-ocr tesseract-ocr-fra

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs           from 'fs';
import * as path         from 'path';
import { execFile }      from 'child_process';
import { promisify }     from 'util';

const execFileAsync = promisify(execFile);

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

export interface ExtractedField<T> {
  value:      T | null;
  confidence: ConfidenceLevel;
  raw:        string | null;
}

export interface OcrInvoiceResult {
  invoice_number_supplier: ExtractedField<string>;
  invoice_date:            ExtractedField<string>;
  supplier_name:           ExtractedField<string>;
  subtotal_ht:             ExtractedField<number>;
  tax_amount:              ExtractedField<number>;
  timbre_fiscal:           ExtractedField<number>;
  net_amount:              ExtractedField<number>;
  raw_text:                string;
  ocr_confidence:          number;
  processing_time_ms:      number;
}

@Injectable()
export class OcrService {

  private readonly logger = new Logger(OcrService.name);

  constructor(private readonly config: ConfigService) {}

  async extractFromFile(filePath: string): Promise<OcrInvoiceResult> {
    const start = Date.now();

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException(`Fichier introuvable : ${filePath}`);
    }

    const ext = path.extname(absolutePath).toLowerCase();
    let imagePath = absolutePath;
    if (ext === '.pdf') {
      imagePath = await this.convertPdfToImage(absolutePath);
    }

    const rawText = await this.runTesseract(imagePath);

    if (!rawText || rawText.trim().length < 10) {
      throw new BadRequestException(
        'Aucun texte extrait — vérifiez que l\'image est lisible et nette.',
      );
    }

    const result        = this.parseInvoiceText(rawText);
    result.processing_time_ms = Date.now() - start;

    this.logger.log(
      `Tesseract OCR terminé en ${result.processing_time_ms}ms — ${rawText.length} caractères extraits`,
    );

    return result;
  }

  // ─── Tesseract CLI ────────────────────────────────────────────────────────
  private async runTesseract(imagePath: string): Promise<string> {
    const outputBase = imagePath + '_out';

    // FIX Windows : chemin absolu vers tesseract.exe
    // NestJS hérite pas toujours du PATH système
    const tesseractPath = this.config.get<string>(
      'TESSERACT_PATH',
      'C:\Program Files\Tesseract-OCR\tesseract.exe',
    );

    const lang = this.config.get<string>('TESSERACT_LANG', 'eng');

    try {
      await execFileAsync(tesseractPath, [
        imagePath,
        outputBase,
        '-l', lang,
        '--psm', '3',
        '--oem', '3',
      ]);

      const outputFile = outputBase + '.txt';
      if (!fs.existsSync(outputFile)) throw new Error('Fichier sortie non généré');

      const text = fs.readFileSync(outputFile, 'utf-8');
      try { fs.unlinkSync(outputFile); } catch {}
      return text;

    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new BadRequestException(
          `Tesseract introuvable à : ${tesseractPath}. Vérifiez TESSERACT_PATH dans .env`,
        );
      }
      throw new BadRequestException(`Erreur Tesseract : ${err.message}`);
    }
  }

  // ─── PDF → Image via pdf2pic + canvas ────────────────────────────────────
  // npm install pdf2pic  (utilise GraphicsMagick ou ImageMagick)
  // Sur Windows sans GM/IM : on utilise pdfjs-dist pour rendre le PDF
  private async convertPdfToImage(pdfPath: string): Promise<string> {
    const outputPng = pdfPath.replace('.pdf', '_page1.png');

    // Essai 1 : pdftoppm (Poppler) — chemin absolu depuis .env
    const popplerPath = this.config.get<string>('POPPLER_PATH', '');
    const pdftoppm = popplerPath
      ? path.join(popplerPath, 'pdftoppm.exe')
      : 'pdftoppm';
    try {
      const base = pdfPath.replace('.pdf', '_p');
      await execFileAsync(pdftoppm, ['-r','300','-l','1','-png', pdfPath, base]);
      const png1 = base + '-1.png';
      const png2 = base + '-01.png';
      if (fs.existsSync(png1)) return png1;
      if (fs.existsSync(png2)) return png2;
    } catch {}

    // Essai 2 : magick (ImageMagick v7 Windows)
    try {
      await execFileAsync('magick', [
        '-density', '300',
        `${pdfPath}[0]`,
        '-quality', '100',
        outputPng,
      ]);
      if (fs.existsSync(outputPng)) return outputPng;
    } catch {}

    // Essai 3 : convert (ImageMagick v6)
    try {
      await execFileAsync('convert', [
        '-density', '300',
        `${pdfPath}[0]`,
        '-quality', '100',
        outputPng,
      ]);
      if (fs.existsSync(outputPng)) return outputPng;
    } catch {}

    // Essai 4 : pdfjs-dist (pur Node.js, sans dépendance système)
    try {
      return await this.convertPdfWithPdfjs(pdfPath, outputPng);
    } catch (err: any) {
      this.logger.warn(`pdfjs-dist échoué : ${err.message}`);
    }

    throw new BadRequestException(
      'Impossible de convertir le PDF. Solutions : ' +
      '1) Installez Poppler et ajoutez POPPLER_PATH=C:\poppler\Library\bin dans .env ' +
      '2) Uploadez directement une image JPG ou PNG au lieu du PDF.',
    );
  }

  // ─── Conversion PDF → PNG via pdfjs-dist (pur Node.js) ───────────────────
  private async convertPdfWithPdfjs(pdfPath: string, outputPng: string): Promise<string> {
    // npm install pdfjs-dist canvas
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createCanvas } = require('canvas');

    const data     = new Uint8Array(fs.readFileSync(pdfPath));
    const pdfDoc   = await pdfjsLib.getDocument({ data }).promise;
    const page     = await pdfDoc.getPage(1);

    const scale    = 3.0; // 3x = ~216 DPI équivalent
    const viewport = page.getViewport({ scale });
    const canvas   = createCanvas(viewport.width, viewport.height);
    const ctx      = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPng, buffer);

    this.logger.log(`PDF converti en PNG via pdfjs-dist : ${outputPng}`);
    return outputPng;
  }

  // ─── Parser ───────────────────────────────────────────────────────────────
  parseInvoiceText(text: string): OcrInvoiceResult {
    const cleaned = text
      .replace(/\|/g, 'I')
      .replace(/[""'']/g, '"')
      .replace(/\r\n/g, '\n');

    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

    return {
      invoice_number_supplier: this.extractInvoiceNumber(cleaned, lines),
      invoice_date:            this.extractDate(cleaned, lines),
      supplier_name:           this.extractSupplierName(cleaned, lines),
      subtotal_ht:             this.extractSubtotalHT(cleaned),
      tax_amount:              this.extractTaxAmount(cleaned),
      timbre_fiscal:           this.extractTimbreFiscal(cleaned),
      net_amount:              this.extractNetAmount(cleaned),
      raw_text:                cleaned,
      ocr_confidence:          this.computeConfidence(cleaned),
      processing_time_ms:      0,
    };
  }

  private extractInvoiceNumber(text: string, lines: string[]): ExtractedField<string> {
    const patterns = [
      /(?:Facture\s*[Nn]°?|FACTURE\s*[Nn]°?|N°\s*[Ff]acture|Fact\.?\s*[Nn]°?)\s*:?\s*([A-Z0-9\-\/]{3,20})/i,
      /(?:Invoice\s*[Nn]o?\.?|INV)\s*:?\s*([A-Z0-9\-\/]{3,20})/i,
      /\b([A-Z]{2,5}[-\/]\d{4}[-\/]\d{2,6})\b/,
      /\b(FACT[-\/]?\d{4,10})\b/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      const captured = m?.[1];
      if (captured && captured.length >= 3) {
        return { value: captured.toUpperCase().trim(), confidence: p.source.includes('Facture') ? 'high' : 'medium', raw: m![0] };
      }
    }
    for (const line of lines) {
      if (/facture|invoice|n°|réf/i.test(line)) {
        const m = line.match(/([A-Z0-9\-\/]{4,20})/i);
        if (m) return { value: m[1].toUpperCase(), confidence: 'low', raw: line };
      }
    }
    return { value: null, confidence: 'not_found', raw: null };
  }

  private extractDate(text: string, lines: string[]): ExtractedField<string> {
    const monthMap: Record<string, string> = {
      janvier:'01',février:'02',mars:'03',avril:'04',mai:'05',juin:'06',
      juillet:'07',août:'08',septembre:'09',octobre:'10',novembre:'11',décembre:'12',
    };
    const patterns = [
      /(?:Date\s*(?:de\s*)?[Ff]acture|Date\s*:|Le\s*:?)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
      /(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (!m?.[1]) continue;
      const raw = m[1];
      let iso: string | null = null;
      const written = raw.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
      if (written) {
        const month = monthMap[written[2].toLowerCase()];
        if (month) iso = `${written[3]}-${month}-${written[1].padStart(2,'0')}`;
      } else {
        const parts = raw.split(/[\/\-\.]/);
        if (parts.length === 3 && parts[2].length === 4)
          iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
      if (iso && this.isValidDate(iso))
        return { value: iso, confidence: p.source.includes('Date') ? 'high' : 'medium', raw };
    }
    return { value: null, confidence: 'not_found', raw: null };
  }

  private extractSupplierName(text: string, lines: string[]): ExtractedField<string> {
    const patterns = [
      /(?:Vendeur\s*:|Fournisseur\s*:|De\s*:|Émetteur\s*:)\s*(.+)/i,
      /(?:Société|Entreprise|SARL|SA\b|SUARL)\s*:?\s*(.+)/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) {
        const name = m[1].split('\n')[0].trim().substring(0, 80);
        if (name.length >= 3) return { value: name, confidence: 'high', raw: m[0] };
      }
    }
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const l = lines[i];
      if (l.length >= 5 && l.length <= 80 && !/^\d/.test(l) &&
          !/^(facture|invoice|date|tel|fax|email|www)/i.test(l) &&
          /[A-Za-zÀ-ÿ]{3,}/.test(l))
        return { value: l, confidence: 'low', raw: l };
    }
    return { value: null, confidence: 'not_found', raw: null };
  }

  private extractSubtotalHT(text: string): ExtractedField<number> {
    return this.extractAmount(text, [
      /(?:Total?\s*HT|Sous[\s-]?total\s*HT|Montant\s*HT|Base\s*[Hh]ors\s*[Tt]axe)\s*:?\s*([\d\s.,]+)/i,
      /(?:Hors\s*Taxe|H\.T\.)\s*:?\s*([\d\s.,]+)/i,
    ]);
  }

  private extractTaxAmount(text: string): ExtractedField<number> {
    return this.extractAmount(text, [
      /(?:Total?\s*TVA|Montant\s*TVA|T\.V\.A\.?)\s*:?\s*([\d\s.,]+)/i,
      /TVA\s+(?:19|13|7|0)\s*%\s*:?\s*([\d\s.,]+)/i,
    ]);
  }

  private extractTimbreFiscal(text: string): ExtractedField<number> {
    const result = this.extractAmount(text, [
      /(?:Timbre\s*[Ff]iscal|Droit\s*de\s*[Tt]imbre|Timbre)\s*:?\s*([\d\s.,]+)/i,
    ]);
    return result.value !== null ? result
      : { value: 1.000, confidence: 'medium', raw: 'Valeur par défaut tunisienne (1,000 TND)' };
  }

  private extractNetAmount(text: string): ExtractedField<number> {
    return this.extractAmount(text, [
      /(?:Net\s*[àa]\s*[Pp]ayer|Total\s*TTC|Montant\s*TTC|TOTAL\s*GENERAL)\s*:?\s*([\d\s.,]+)/i,
      /(?:T\.T\.C\.?)\s*:?\s*([\d\s.,]+)/i,
    ]);
  }

  private extractAmount(text: string, patterns: RegExp[]): ExtractedField<number> {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) {
        const v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(v) && v > 0)
          return { value: Math.round(v * 1000) / 1000, confidence: 'high', raw: m[0] };
      }
    }
    return { value: null, confidence: 'not_found', raw: null };
  }

  private computeConfidence(text: string): number {
    let s = 0;
    if (/facture|invoice/i.test(text))                     s += 20;
    if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(text)) s += 20;
    if (/HT|TTC|TVA/i.test(text))                         s += 20;
    if (/timbre/i.test(text))                              s += 10;
    if (/\d+[,\.]\d{3}/.test(text))                       s += 10;
    if (text.length > 200)                                 s += 10;
    if (text.length > 500)                                 s += 10;
    return Math.min(100, s);
  }

  private isValidDate(iso: string): boolean {
    const d = new Date(iso);
    return !isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2035;
  }
}