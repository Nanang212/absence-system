import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import NodeRSA = require('node-rsa');

const logger = new Logger('AuthService');

@Injectable()
export class AuthService {
  /**
   * Authenticate user directly via PeopleHR
   * Returns user info AND password if login successful (password needed for remote swipe)
   */
  async loginViaPeopleHR(
    email: string,
    password: string
  ): Promise<{ ok: boolean; user?: { email: string; fullName?: string; password?: string }; message?: string }> {
    const base = process.env.REMOTE_BASE_URL ?? '';
    const loginPagePath = process.env.REMOTE_LOGIN_PATH ?? '/hr/security/login?ReturnUrl=%2fhr';
    const loginApiPath = '/hr/api/securityapi/getauthuser';

    try {
      const jar = new CookieJar();
      const client = wrapper(axios.create({ jar, withCredentials: true }));

      // Step 1: Fetch login page to get public key and CSRF token
      logger.log('Fetching login page...');
      const loginPageRes = await client.get(base + loginPagePath);
      const $ = cheerio.load(loginPageRes.data);

      const publicKeyBase64 = $('#hdnPublicKey').val() as string;
      if (!publicKeyBase64) {
        throw new Error('Could not find RSA public key in login page');
      }

      const csrfToken = $('input[name=__RequestVerificationToken]').val() as string;
      if (!csrfToken) {
        throw new Error('Could not find CSRF token in login page');
      }

      // Step 2: Encrypt credentials
      const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');
      const key = new NodeRSA(publicKeyPem);
      key.setOptions({ encryptionScheme: 'pkcs1' });

      const encryptedUserName = key.encrypt(email, 'base64');
      const encryptedPassword = key.encrypt(password, 'base64');

      // Step 3: Submit login
      const loginPayload = {
        userName: encryptedUserName,
        password: encryptedPassword,
        returnurl: '/hr/home/index',
      };

      const loginRes = await client.post(base + loginApiPath, loginPayload, {
        headers: {
          '__RequestVerificationToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json; charset=UTF-8',
        },
        validateStatus: () => true,
      });

      // Check if login was successful
      if (loginRes.status !== 200 || !loginRes.data || loginRes.data.status === false) {
        logger.warn(`Login failed for ${email}`);
        return { ok: false, message: 'Invalid credentials' };
      }

      logger.log(`Login successful for ${email}`);

      // Extract user info from response
      const userData = loginRes.data;
      const fullName = userData?.fullName || userData?.FullName || userData?.name || null;

      return {
        ok: true,
        user: {
          email,
          fullName,
          password, // Return password for remote swipe (will be stored in frontend session)
        },
      };
    } catch (error) {
      logger.error(`Login error for ${email}:`, error.message);
      return { ok: false, message: 'Login failed. Please try again.' };
    }
  }
}
