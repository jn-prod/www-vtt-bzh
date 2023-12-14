import { Kind } from './calendar-events.types';
import { ObjectId, Document } from 'db-connector';

export class CreateEventDto implements Document {
  constructor(
    public readonly date: Date,
    public readonly hour: string,
    public readonly active = true,
    public readonly id?: ObjectId,
    public readonly name?: string,
    public readonly city?: string,
    public readonly departement?: 22 | 29 | 35 | 44 | 56 | number,
    public readonly updatedAt?: Date,
    public readonly organisateur?: string,
    public readonly website?: string,
    public readonly place?: string,
    public readonly price?: string,
    public readonly contact?: string,
    public readonly description?: string,
    public readonly origin = 'form',
    public readonly kind?: Kind,
    public readonly canceled?: boolean,
    public readonly lock = false,
  ) {}
}

export class UpdateEventDto extends CreateEventDto {
  constructor(
    public readonly id: ObjectId,
    public readonly date: Date,
    public readonly hour: string,
    public readonly active: boolean,
  ) {
    super(date, hour, active);
  }
}

export const isCreateEventDto = (
  payload: unknown,
): payload is CreateEventDto => {
  if (typeof payload === 'object') {
    const event = payload as CreateEventDto;
    return typeof event.hour === 'string';
  } else return false;
};
