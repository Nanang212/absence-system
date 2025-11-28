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
    this.client.on('qr', (qr) => {
      this.logger.log('='.repeat(50));
      this.logger.log('SCAN QR CODE WHATSAPP DI BAWAH INI:');
      this.logger.log('='.repeat(50));
      qrcode.generate(qr, { small: true });
      this.logger.log('='.repeat(50));
      this.logger.log('Buka WhatsApp di HP → Linked Devices → Link a Device');
      this.logger.log('Scan QR code di atas untuk menghubungkan bot');
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
