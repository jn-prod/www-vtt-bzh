import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CalendarEventModule } from './events/events.module';

const path = 'calendar';

@Module({
  imports: [
    CalendarEventModule,
    RouterModule.register([
      {
        path,
        module: CalendarEventModule,
      },
    ]),
  ],
})
export class CalendarModule {}
