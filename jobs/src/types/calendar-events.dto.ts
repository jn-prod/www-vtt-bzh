import { Kind } from './calendar-events.types';

export class CreateEventDto {
  constructor(
    public readonly date: Date,
    public readonly hour: string,
    public readonly active = true,
    public readonly name: string,
    public readonly kind: Kind,
    public readonly id?: string,
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
    public readonly canceled?: boolean,
    public readonly lock = false
  ) {}
}

export type UpdateEventDto = Partial<CreateEventDto>;

export const isCreateEventDto = (payload: unknown): payload is CreateEventDto => {
  if (typeof payload === 'object') {
    const event = payload as CreateEventDto;
    return typeof event.hour === 'string';
  } else return false;
};
