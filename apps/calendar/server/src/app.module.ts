import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarModule } from './calendar/calendar.module';
import { RolesGuard } from './accounts/roles';
import { JwtAuthGuard } from './accounts/auth/jwt-auth.guard';
import { AccountsModule } from './accounts/account.module';
import config from './config/default';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
    }),
    MongooseModule.forRoot(config().mongoUrl),
    ScheduleModule.forRoot(),
    AccountsModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
