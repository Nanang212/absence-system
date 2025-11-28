import { Body, Controller, Post, Get, Query, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

class ClockInDto {
  email: string;
  password: string; // Password for PeopleHR remote swipe
  timestamp?: string;
  latitude?: number;
  longitude?: number;
}

class ClockOutDto {
  email: string;
  password: string; // Password for PeopleHR remote swipe
  notes?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
}

@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  /**
   * Get attendance list with date range filter and grouped by day
   * Query params: email (optional), startDate (optional), endDate (optional)
   * Example: /attendance/list?email=user@example.com&startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('list')
  async getList(
    @Query('email') email?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const records = await this.svc.getAttendanceList(email, startDate, endDate);
    return { ok: true, data: records };
  }

  /**
   * Clock In endpoint
   */
  @Post('clock-in')
  async clockIn(@Body() body: ClockInDto) {
    if (!body.email) throw new BadRequestException('email is required');
    if (!body.password) throw new BadRequestException('password is required');
    const rec = await this.svc.clockIn(body.email, body.password, body.timestamp, body.latitude, body.longitude);
    return { ok: true, attendance: rec };
  }

  /**
   * Clock Out endpoint
   */
  @Post('clock-out')
  async clockOut(@Body() body: ClockOutDto) {
    if (!body.email) throw new BadRequestException('email is required');
    if (!body.password) throw new BadRequestException('password is required');
    const rec = await this.svc.clockOut(body.email, body.password, body.notes, body.timestamp, body.latitude, body.longitude);
    return { ok: true, attendance: rec };
  }

  /**
   * Get today's attendance status for a user
   */
  @Get('today-status')
  async getTodayStatus(@Query('email') email?: string) {
    if (!email) throw new BadRequestException('email is required');
    const status = await this.svc.getTodayStatus(email);
    return { ok: true, ...status };
  }
}
