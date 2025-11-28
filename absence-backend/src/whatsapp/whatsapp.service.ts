import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private client: Client;
  private isReady = false;
  private readonly logger = new Logger(WhatsAppService.name);

  async onModuleInit() {
    // Initialize WhatsApp client with persistent session
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth', // Session will be saved here
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    // Event: QR Code for authentication
    this.client.on('qr', async (qr) => {
      this.logger.log('='.repeat(50));
      this.logger.log('SCAN QR CODE WHATSAPP DI BAWAH INI:');
      this.logger.log('='.repeat(50));
      
      // Generate QR code in terminal (bisa kepotong di Railway)
      qrcode.generate(qr, { small: true });
      
      try {
        // Save QR code to image file (solusi untuk Railway)
        const qrImagePath = '/tmp/whatsapp-qr.png';
        await QRCode.toFile(qrImagePath, qr, {
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 300
        });
        
        this.logger.log('✅ QR Code saved to: ' + qrImagePath);
        this.logger.log('📱 Download file ini dari Railway untuk scan QR code!');
        
        // Generate QR as data URL for logs
        const qrDataUrl = await QRCode.toDataURL(qr);
        this.logger.log('🔗 QR Data URL (backup): ' + qrDataUrl.substring(0, 100) + '...');
        
      } catch (error) {
        this.logger.error('❌ Failed to save QR code image:', error);
      }
      
      this.logger.log('='.repeat(50));
      this.logger.log('Buka WhatsApp di HP → Linked Devices → Link a Device');
      this.logger.log('Scan QR code di atas ATAU download file whatsapp-qr.png');
      this.logger.log('='.repeat(50));
    });

    // Event: Client is ready
    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('✅ WhatsApp Bot sudah terhubung dan siap digunakan!');
      this.logger.log('Bot akan mengirim notifikasi ke grup yang sudah ditentukan.');
    });

    // Event: Authentication success
    this.client.on('authenticated', () => {
      this.logger.log('✅ WhatsApp authenticated successfully');
    });

    // Event: Authentication failure
    this.client.on('auth_failure', (msg) => {
      this.logger.error('❌ WhatsApp authentication failed:', msg);
    });

    // Event: Disconnected
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.logger.warn('⚠️ WhatsApp disconnected:', reason);
    });

    // Initialize the client
    this.logger.log('Menginisialisasi WhatsApp Bot...');
    await this.client.initialize();
  }

  /**
   * Send message to WhatsApp group
   * @param groupName - Nama grup WhatsApp (contoh: "Absensi MII Jasamarga")
   * @param message - Pesan yang akan dikirim
   */
  async sendToGroup(groupName: string, message: string): Promise<void> {
    if (!this.isReady) {
      this.logger.warn('WhatsApp client belum ready. Pesan tidak terkirim.');
      return;
    }

    try {
      // Get all chats
      const chats = await this.client.getChats();
      
      // Find the group by name
      const group = chats.find(
        (chat) => chat.isGroup && chat.name === groupName
      );

      if (!group) {
        this.logger.error(`Grup WhatsApp "${groupName}" tidak ditemukan.`);
        this.logger.log('Daftar grup yang tersedia:');
        chats
          .filter((chat) => chat.isGroup)
          .forEach((chat) => this.logger.log(`  - ${chat.name}`));
        return;
      }

      // Send message to group
      await group.sendMessage(message);
      this.logger.log(`✅ Pesan terkirim ke grup "${groupName}"`);
    } catch (error) {
      this.logger.error('Gagal mengirim pesan WhatsApp:', error.message);
    }
  }

  /**
   * Get client ready status
   */
  isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Get list of available groups
   */
  async getGroups(): Promise<string[]> {
    if (!this.isReady) {
      return [];
    }

    try {
      const chats = await this.client.getChats();
      return chats
        .filter((chat) => chat.isGroup)
        .map((chat) => chat.name);
    } catch (error) {
      this.logger.error('Gagal mengambil daftar grup:', error.message);
      return [];
    }
  }
}
