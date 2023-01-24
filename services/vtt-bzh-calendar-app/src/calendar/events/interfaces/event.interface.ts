import { Document } from 'mongoose';
import { Kind } from '../enums/kind.enum';
export interface ICalendarEvent extends Document {
  readonly name: string;
  readonly city: string;
  readonly departement: string;
  readonly date: Date;
  readonly updatedAt: Date;
  readonly organisateur: string;
  readonly hour: string;
  readonly website: string;
  readonly place: string;
  readonly price: string;
  readonly contact: string;
  readonly description: string;
  readonly origin: string;
  readonly kind: Kind;
  readonly canceled: boolean;
  readonly active?: boolean;
}

export type CalendarEventDbQuery = {
  date?: any;
  name?: string;
  city?: string;
  departement?: string;
  updatedAt?: Date;
  organisateur?: string;
  hour?: string;
  website?: string;
  place?: string;
  price?: string;
  contact?: string;
  description?: string;
  origin?: string;
  kind?: Kind;
  canceled?: boolean;
  active?: boolean;
};
