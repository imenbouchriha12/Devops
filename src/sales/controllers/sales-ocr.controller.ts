// src/sales/controllers/sales-ocr.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';
import { SalesOcrService } from '../services/sales-ocr.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('businesses/:businessId/sales/ocr')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalesOcrController {
  constructor(private readonly ocrService: SalesOcrService) {}

  @Post('scan')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'sales-ocr-temp');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async scanDocument(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|pdf)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    try {
      const result = await this.ocrService.extractFromFile(file.path);

      // Cleanup temp file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn('Failed to delete temp file:', err);
      }

      return {
        success: true,
        data: result,
        message: 'Document scanné avec succès',
      };
    } catch (error) {
      // Cleanup temp file on error
      try {
        fs.unlinkSync(file.path);
      } catch {}

      throw error;
    }
  }

  @Post('scan-invoice')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'sales-ocr-temp');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          const ext = path.extname(file.originalname);
          cb(null, `invoice_${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async scanInvoice(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    try {
      const result = await this.ocrService.extractFromFile(file.path);

      if (result.document_type !== 'invoice') {
        throw new BadRequestException(
          `Type de document incorrect. Attendu: facture, Reçu: ${result.document_type}`,
        );
      }

      // Cleanup temp file
      try {
        fs.unlinkSync(file.path);
      } catch {}

      return {
        success: true,
        data: result,
        message: 'Facture scannée avec succès',
      };
    } catch (error) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw error;
    }
  }

  @Post('scan-quote')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'sales-ocr-temp');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          const ext = path.extname(file.originalname);
          cb(null, `quote_${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async scanQuote(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    try {
      const result = await this.ocrService.extractFromFile(file.path);

      if (result.document_type !== 'quote') {
        throw new BadRequestException(
          `Type de document incorrect. Attendu: devis, Reçu: ${result.document_type}`,
        );
      }

      // Cleanup temp file
      try {
        fs.unlinkSync(file.path);
      } catch {}

      return {
        success: true,
        data: result,
        message: 'Devis scanné avec succès',
      };
    } catch (error) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw error;
    }
  }
}
