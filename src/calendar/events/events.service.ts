import { Injectable, NotFoundException } from '@nestjs/common';
import { ICalendarEvent } from './interfaces/event.interface';
import { CreateEventDto, UpdateEventDto, QueryEventDto } from './dto';
import { CalendarEvent } from './schemas/event.schema';
import { EventsRepository } from './events.repository';
@Injectable()
export class EventsService {
  constructor(private eventsRepository: EventsRepository) {}

  public async findAll(queryEvent: QueryEventDto): Promise<CalendarEvent[]> {
    const { limit, skip, sort, filter, projection } = queryEvent;
    return this.eventsRepository.find(projection, limit, skip, sort, filter);
  }

  public async findOne(
    eventId: string,
    queryEvent: QueryEventDto,
  ): Promise<CalendarEvent> {
    const { projection } = queryEvent;
    const event = await this.eventsRepository.findOne(
      eventId,
      projection,
      queryEvent,
    );

    if (!event) {
      throw new NotFoundException(`Event #${eventId} not found`);
    }

    return event;
  }

  public async create(createEventDto: CreateEventDto): Promise<ICalendarEvent> {
    const event = await this.eventsRepository.create(createEventDto);
    return event;
  }

  public async updateById(
    eventId: string,
    updateEventDto: UpdateEventDto,
  ): Promise<ICalendarEvent> {
    const event = await this.eventsRepository.updateById(
      eventId,
      updateEventDto,
    );

    if (!event) {
      throw new NotFoundException(`Event #${eventId} not found`);
    }

    return event;
  }

  public async remove(eventId: string): Promise<any> {
    const event = await this.eventsRepository.remove(eventId);
    return event;
  }

  public async updateOrCreate(
    query: any,
    updateEventDto: UpdateEventDto,
  ): Promise<ICalendarEvent> {
    const event = await this.eventsRepository.updateOrCreate(
      query,
      updateEventDto,
    );

    return event;
  }
}
