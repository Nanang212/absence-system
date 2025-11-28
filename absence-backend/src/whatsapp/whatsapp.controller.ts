import { Controller, Get, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  @Get('qr-download')
  async downloadQR(@Res() res: Response) {
    try {
      const qrPath = '/tmp/whatsapp-qr.png';
      
      // Check if QR file exists
      if (!fs.existsSync(qrPath)) {
        return res.status(404).json({ 
          message: 'QR code tidak ditemukan. Restart backend untuk generate QR baru.' 
        });
      }

      // Send file for download
      this.logger.log('📱 QR Code downloaded');
      res.download(qrPath, 'whatsapp-qr.png', (err) => {
        if (err) {
          this.logger.error('Error downloading QR:', err);
          res.status(500).json({ message: 'Download failed' });
        }
      });

    } catch (error) {
      this.logger.error('Error in QR download:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  @Get('qr-status')
  async getQRStatus() {
    try {
      const qrPath = '/tmp/whatsapp-qr.png';
      const exists = fs.existsSync(qrPath);
      
      return {
        qrExists: exists,
        message: exists 
          ? 'QR code tersedia untuk download' 
          : 'QR code belum tersedia. Restart backend untuk generate QR.',
        downloadUrl: exists ? '/whatsapp/qr-download' : null
      };
    } catch (error) {
      return {
        qrExists: false,
        message: 'Error checking QR status',
        downloadUrl: null
      };
    }
  }
}