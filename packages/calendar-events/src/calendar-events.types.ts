export enum Kind {
  VTT = 'vtt',
}

export type CalendarEvent = {
  name: string;
  kind: Kind;
  date?: Date;
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
  canceled?: boolean;
  active?: boolean;
  lock: boolean;
};
