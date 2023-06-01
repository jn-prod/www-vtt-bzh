import { connectToDatabase } from 'db-connector';
import { getController, postController, formatResponse, IHandler } from 'base-lambda';
import { CreateEventDto, isCreateEventDto, CalendarEvent } from 'calendar-events';
import { runner } from './events.job';
import config from './config';

export { healthcheck } from 'base-lambda';

export const getEvents: IHandler = (event) => getController<CalendarEvent>(config)(event);

export const postEvent: IHandler = (event) =>
  postController<CalendarEvent, CreateEventDto>(config, isCreateEventDto)(event);

export const getEventById: IHandler = async (event) => {
  const id = event?.pathParameters?.id;
  if (!id) {
    return await formatResponse(404, 'GET', { message: 'Not found' }, config.baseUrl);
  } else {
    return await formatResponse(200, 'GET', { data: `event ${id}` }, config.baseUrl);
  }
};

export const cron: IHandler = async () =>
  (await connectToDatabase(config.mongoUrl, config.moduleName)).match({
    Ok: async (dbConnection) => {
      const data = await runner(dbConnection, config);
      console.log('[cron] - succeed to get events');

      const body = { data, kind: 'event' };

      return formatResponse(200, 'GET', body, config.baseUrl);
    },
    Error: async (err) => formatResponse(500, 'GET', { err }, config.baseUrl),
  });

// @Public()
// @Get()
// public async getAllEvent(@Res() res, @Query() query: QueryEventDto) {
//   const events = await this.eventsService.findAll(query);
//   return res.status(HttpStatus.OK).json({ events, count: events.length });
// }

// @Get('/:id')
// public async getEvent(@Res() res, @Param('id') eventId: string, @Query() query: QueryEventDto) {
//   if (!eventId) {
//     throw new NotFoundException('Event ID does not exist');
//   }

//   const event = await this.eventsService.findOne(eventId, query);

//   return res.status(HttpStatus.OK).json(event);
// }

// @Post()
// @Roles(Role.Contributor)
// public async addEvent(@Res() res, @Body() createEventDto: CreateEventDto) {
//   try {
//     const event = await this.eventsService.create(createEventDto);
//     return res.status(HttpStatus.OK).json({
//       message: 'Event has been created successfully',
//       event,
//     });
//   } catch (err) {
//     return res.status(HttpStatus.BAD_REQUEST).json({
//       message: 'Error: Event not created!',
//       status: 400,
//     });
//   }
// }

// @Put('/:id')
// @Roles(Role.Contributor)
// public async updateEvent(@Res() res, @Param('id') eventId: string, @Body() updateEventDto: UpdateEventDto) {
//   try {
//     const event = await this.eventsService.updateById(eventId, updateEventDto);
//     if (!event) {
//       throw new NotFoundException('Event does not exist!');
//     }
//     return res.status(HttpStatus.OK).json({
//       message: 'Event has been successfully updated',
//       event,
//     });
//   } catch (err) {
//     return res.status(HttpStatus.BAD_REQUEST).json({
//       message: 'Error: Event not updated!',
//       status: 400,
//     });
//   }
// }

// @Delete('/:id')
// @Roles(Role.Admin)
// public async deleteEvent(@Res() res, @Param('id') eventId: string) {
//   if (!eventId) {
//     throw new NotFoundException('Event ID does not exist');
//   }

//   const event = await this.eventsService.remove(eventId);

//   return res.status(HttpStatus.OK).json({
//     message: 'Event has been deleted',
//     event,
//   });
// }
