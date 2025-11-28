import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AuthModule, AttendanceModule, WhatsAppModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
