import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import axios from 'axios';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const result = await this.authService.loginViaPeopleHR(body.email, body.password);
    return result;
  }

  // Debug endpoint: Test PeopleHR connectivity
  @Get('test-peoplehr')
  async testPeopleHR() {
    const baseUrl = process.env.REMOTE_BASE_URL || 'https://mii-jasamarga.peoplehr.net';
    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      return {
        ok: true,
        message: 'Successfully connected to PeopleHR',
        status: response.status,
        baseUrl,
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Failed to connect to PeopleHR',
        error: error.message,
        baseUrl,
      };
    }
  }
}
