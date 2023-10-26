import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarEventSchema, CalendarEvent } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
  ],
  providers: [EventsService, EventsRepository],
  controllers: [EventsController],
})
export class CalendarEventModule {}
