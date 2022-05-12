import { Injectable } from '@nestjs/common';
import { CalendarEvent } from './schemas/event.schema';
import { Model } from 'mongoose';
import { CreateEventDto, UpdateEventDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from 'src/common/base/base.repository';

@Injectable()
export class EventsRepository extends BaseRepository<
  CalendarEvent,
  CreateEventDto,
  UpdateEventDto
> {
  constructor(
    @InjectModel(CalendarEvent.name)
    private readonly calendarEventCollection: Model<CalendarEvent>,
  ) {
    super(calendarEventCollection);
  }
}
