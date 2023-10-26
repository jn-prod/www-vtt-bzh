import {
  Controller,
  Get,
  Logger,
  Res,
  HttpStatus,
  Post,
  Body,
  Put,
  NotFoundException,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, QueryEventDto } from './dto';
import { ApiTags } from '@nestjs/swagger';
import { runner } from './events.job';
import { Role, Roles } from '../../accounts/roles';
import { Public } from '../../accounts/auth/auth.decorators';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}
  private readonly logger = new Logger(EventsController.name);

  @Cron('0 30 2 * * 0-6')
  // @Cron('0 */30 9-17 * * *')
  scrapper() {
    this.logger.debug('start cron job');
    try {
      return runner(this.eventsService);
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Public()
  @Get()
  public async getAllEvent(@Res() res, @Query() query: QueryEventDto) {
    const events = await this.eventsService.findAll(query);
    return res.status(HttpStatus.OK).json({ events, count: events.length });
  }

  @Get('/:id')
  public async getEvent(
    @Res() res,
    @Param('id') eventId: string,
    @Query() query: QueryEventDto,
  ) {
    if (!eventId) {
      throw new NotFoundException('Event ID does not exist');
    }

    const event = await this.eventsService.findOne(eventId, query);

    return res.status(HttpStatus.OK).json(event);
  }

  @Post()
  @Roles(Role.Contributor)
  public async addEvent(@Res() res, @Body() createEventDto: CreateEventDto) {
    try {
      const event = await this.eventsService.create(createEventDto);
      return res.status(HttpStatus.OK).json({
        message: 'Event has been created successfully',
        event,
      });
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Error: Event not created!',
        status: 400,
      });
    }
  }

  @Put('/:id')
  @Roles(Role.Contributor)
  public async updateEvent(
    @Res() res,
    @Param('id') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    try {
      const event = await this.eventsService.updateById(
        eventId,
        updateEventDto,
      );
      if (!event) {
        throw new NotFoundException('Event does not exist!');
      }
      return res.status(HttpStatus.OK).json({
        message: 'Event has been successfully updated',
        event,
      });
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Error: Event not updated!',
        status: 400,
      });
    }
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  public async deleteEvent(@Res() res, @Param('id') eventId: string) {
    if (!eventId) {
      throw new NotFoundException('Event ID does not exist');
    }

    const event = await this.eventsService.remove(eventId);

    return res.status(HttpStatus.OK).json({
      message: 'Event has been deleted',
      event,
    });
  }
}
