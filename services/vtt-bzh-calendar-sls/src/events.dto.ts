import { Kind } from './events.types';
import { ObjectId, Document } from 'mongodb';

export enum Origin {
  CRON = 'cron',
  FORM = 'form'
}

export class CreateEventDto implements Document {
  constructor(
    public readonly date: Date,
    public readonly hour: string,
    public readonly active: boolean,
    public readonly id?: ObjectId,
    public readonly name?: string,
    public readonly city?: string,
    public readonly departement?: string,
    public readonly updatedAt?: Date,
    public readonly organisateur?: string,
    public readonly website?: string,
    public readonly place?: string,
    public readonly price?: string,
    public readonly contact?: string,
    public readonly description?: string,
    public readonly origin = 'form',
    public readonly kind?: Kind,
    public readonly canceled?: boolean
  ) {}
}

export class UpdateEventDto extends CreateEventDto {
  constructor(
    public readonly id: ObjectId,
    public readonly date: Date,
    public readonly hour: string,
    public readonly active: boolean
  ) {
    super(date, hour, active);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCreateEventDto = (payload: any): payload is CreateEventDto => typeof payload.hour === 'string';
