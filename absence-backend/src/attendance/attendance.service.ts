import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import NodeRSA = require('node-rsa');

const logger = new Logger('AttendanceService');

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async recordAttendance(
    email: string,
    password: string, // User's PeopleHR password for remote swipe
    type: 'IN' | 'OUT',
    comment?: string,
    timestampIso?: string,
    notes?: string,
    latitude?: number,
    longitude?: number
  ) {
    const ts = timestampIso ? new Date(timestampIso) : new Date();
    const finalComment = comment ?? this.generateComment(type, ts);

    const rec = await this.prisma.attendance.create({
      data: {
        email,
        type,
        comment: finalComment,
        timestamp: ts,
        notes: notes || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });

    try {
      // Use password from parameter (user's password they typed during login)
      if (password) {
        await this.performRemoteSwipe(email, password, type, comment);
      } else {
        logger.warn('No password provided for remote swipe');
      }

      await this.sendTelegramNotification({ email }, type, ts, latitude, longitude, notes);
      await this.sendWhatsAppNotification({ email }, type, ts, latitude, longitude, notes);
    } catch (e) {
      logger.error('Remote swipe or notification failed: ' + String(e));
    }

    return rec;
  }

  async clockIn(email: string, password: string, timestampIso?: string, latitude?: number, longitude?: number) {
    const now = timestampIso ? new Date(timestampIso) : new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingIn = await this.prisma.attendance.findFirst({
      where: {
        email,
        type: 'IN',
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingIn) {
      throw new Error('Anda sudah clock in hari ini.');
    }

    return this.recordAttendance(email, password, 'IN', undefined, timestampIso, undefined, latitude, longitude);
  }

  async clockOut(email: string, password: string, notes?: string, timestampIso?: string, latitude?: number, longitude?: number) {
    const now = timestampIso ? new Date(timestampIso) : new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingOut = await this.prisma.attendance.findFirst({
      where: {
        email,
        type: 'OUT',
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });

    // TESTING MODE: Allow update
    if (existingOut) {
      logger.log('Clock out exists, updating...');
      const ts = timestampIso ? new Date(timestampIso) : new Date();
      const finalComment = this.generateComment('OUT', ts);

      const updated = await this.prisma.attendance.update({
        where: { id: existingOut.id },
        data: {
          timestamp: ts,
          comment: finalComment,
          notes: notes || null,
          latitude: latitude || null,
          longitude: longitude || null,
        },
      });

      try {
        const remotePassword = password;
        if (remotePassword) {
          await this.performRemoteSwipe(email, remotePassword, 'OUT', finalComment);
        }
        await this.sendTelegramNotification({ email }, 'OUT', ts, latitude, longitude, notes);
        await this.sendWhatsAppNotification({ email }, 'OUT', ts, latitude, longitude, notes);
      } catch (e) {
        logger.error('Remote swipe or notification failed: ' + String(e));
      }

      return updated;
    }

    const existingIn = await this.prisma.attendance.findFirst({
      where: {
        email,
        type: 'IN',
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!existingIn) {
      throw new Error('Anda belum clock in hari ini.');
    }

    return this.recordAttendance(email, password, 'OUT', undefined, timestampIso, notes, latitude, longitude);
  }

  async getTodayStatus(email: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecords = await this.prisma.attendance.findMany({
      where: {
        email,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });

    const hasClockedIn = todayRecords.some((r) => r.type === 'IN');
    const hasClockedOut = todayRecords.some((r) => r.type === 'OUT');

    return { hasClockedIn, hasClockedOut };
  }

  async getAttendanceList(email?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (email) {
      where.email = email;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        where.timestamp.lte = end;
      }
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    const grouped = new Map<string, any>();

    for (const record of records) {
      const date = new Date(record.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      const compositeKey = `${record.email}-${dateKey}`;

      if (!grouped.has(compositeKey)) {
        grouped.set(compositeKey, {
          email: record.email,
          date: dateKey,
          clockIn: null,
          clockInComment: null,
          clockOut: null,
          clockOutComment: null,
        });
      }

      const entry = grouped.get(compositeKey);
      if (record.type === 'IN') {
        if (!entry.clockIn || new Date(record.timestamp) < new Date(entry.clockIn)) {
          entry.clockIn = record.timestamp.toISOString();
          entry.clockInComment = record.comment;
        }
      } else if (record.type === 'OUT') {
        if (!entry.clockOut || new Date(record.timestamp) > new Date(entry.clockOut)) {
          entry.clockOut = record.timestamp.toISOString();
          entry.clockOutComment = record.comment;
        }
      }
    }

    const result = Array.from(grouped.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.email.localeCompare(b.email);
    });

    return result;
  }

  private generateComment(type: 'IN' | 'OUT', ts: Date) {
    const date = new Date(ts);
    const shiftStart = new Date(date);
    shiftStart.setHours(8, 0, 0, 0);
    const shiftEnd = new Date(date);
    shiftEnd.setHours(17, 0, 0, 0);

    if (type === 'IN') {
      if (date.getTime() === shiftStart.getTime()) return 'Datang tepat waktu';
      return date.getTime() < shiftStart.getTime() ? 'Datang lebih cepat' : 'Datang terlambat';
    }

    if (date.getTime() === shiftEnd.getTime()) return 'Pulang tepat waktu';
    return date.getTime() < shiftEnd.getTime() ? 'Pulang lebih cepat' : 'Pulang terlambat';
  }

  private async performRemoteSwipe(email: string, password: string, type: string, comment?: string) {
    const base = process.env.REMOTE_BASE_URL ?? '';
    const loginPagePath = process.env.REMOTE_LOGIN_PATH ?? '/hr/security/login?ReturnUrl=%2fhr';
    const loginApiPath = '/hr/api/securityapi/getauthuser';
    const swipePath = process.env.REMOTE_MANUAL_SWIPE_PATH ?? '/hr/TNAV9/api/ManualSwipe/SubmitManualSwipe';

    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    logger.log('Fetching login page...');
    const loginPageRes = await client.get(base + loginPagePath);
    const $ = cheerio.load(loginPageRes.data);

    const publicKeyBase64 = $('#hdnPublicKey').val() as string;
    if (!publicKeyBase64) throw new Error('Could not find RSA public key');

    const csrfToken = $('input[name=__RequestVerificationToken]').val() as string;
    if (!csrfToken) throw new Error('Could not find CSRF token');

    const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');
    const key = new NodeRSA(publicKeyPem);
    key.setOptions({ encryptionScheme: 'pkcs1' });

    const encryptedUserName = key.encrypt(email, 'base64');
    const encryptedPassword = key.encrypt(password, 'base64');

    const loginRes = await client.post(
      base + loginApiPath,
      { userName: encryptedUserName, password: encryptedPassword, returnurl: '/hr/home/index' },
      {
        headers: {
          __RequestVerificationToken: csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json; charset=UTF-8',
        },
        validateStatus: () => true,
      }
    );

    if (loginRes.status !== 200 || !loginRes.data || loginRes.data.status === false) {
      throw new Error('Remote login failed');
    }

    const profileRes = await client.get(base + `/hr/Widgets/ProfileBrief/GetProfileBrief?_=${Date.now()}`, {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${base}/hr/home/index`,
      },
      validateStatus: () => true,
    });

    if (profileRes.status !== 200) throw new Error('Failed to fetch profile brief');

    const employeeId =
      profileRes.data?.EmployeeNumber ||
      profileRes.data?.employeeNumber ||
      profileRes.data?.EmployeeID ||
      profileRes.data?.employeeID;

    if (!employeeId) throw new Error('Employee ID not found');

    const now = new Date();
    const shiftCode = process.env.REMOTE_SHIFT_CODE ?? '000002';

    await client.post(
      base + swipePath,
      {
        Employee: employeeId,
        ActionName: 'SWAP',
        Hours: now.getHours(),
        Minutes: now.getMinutes(),
        ShiftCode: shiftCode,
        Comment: comment ?? '',
        Location: '',
        Latitude: -1,
        Longtitude: -1,
      },
      {
        headers: {
          __RequestVerificationToken: csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          Referer: `${base}/hr/home/index`,
        },
        validateStatus: () => true,
      }
    );

    logger.log('Remote swipe successful');
  }

  private async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'AbsenceSystem/1.0' } }
      );
      return response.data?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  private async sendTelegramNotification(
    user: any,
    type: 'IN' | 'OUT',
    timestamp: Date,
    latitude?: number,
    longitude?: number,
    notes?: string
  ) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    try {
      const firstName = user.email.split('@')[0].split('.')[0];
      const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      const timeStr = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let locationStr = '';
      if (latitude && longitude) {
        const address = await this.getAddressFromCoordinates(latitude, longitude);
        locationStr = `\n📍 Lokasi: ${address}\n🗺️ [Lihat di Maps](https://www.google.com/maps?q=${latitude},${longitude})`;
      }

      let notesStr = '';
      if (type === 'OUT' && notes) notesStr = `\n📝 Catatan: ${notes}`;

      const emoji = type === 'IN' ? '🟢' : '🔴';
      const message = `${emoji} *${type}* - ${capitalizedName} - ${timeStr}${locationStr}${notesStr}`;

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      logger.log(`Telegram sent for ${type} - ${user.email}`);
    } catch (e) {
      logger.error(`Telegram failed: ${String(e)}`);
    }
  }

  private async sendWhatsAppNotification(
    user: any,
    type: 'IN' | 'OUT',
    timestamp: Date,
    latitude?: number,
    longitude?: number,
    notes?: string
  ) {
    const groupName = process.env.WHATSAPP_GROUP_NAME;
    if (!groupName || !this.whatsapp?.isClientReady()) return;

    try {
      const firstName = user.email.split('@')[0].split('.')[0];
      const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      const timeStr = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let locationStr = '';
      if (latitude && longitude) {
        const address = await this.getAddressFromCoordinates(latitude, longitude);
        locationStr = `\n📍 Lokasi: ${address}\n🗺️ https://www.google.com/maps?q=${latitude},${longitude}`;
      }

      let notesStr = '';
      if (type === 'OUT' && notes) notesStr = `\n📝 Catatan: ${notes}`;

      const emoji = type === 'IN' ? '🟢' : '🔴';
      const message = `${emoji} ${type} - ${capitalizedName} - ${timeStr}${locationStr}${notesStr}`;

      await this.whatsapp.sendToGroup(groupName, message);
      logger.log(`WhatsApp sent for ${type} - ${user.email}`);
    } catch (e) {
      logger.error(`WhatsApp failed: ${String(e)}`);
    }
  }
}
