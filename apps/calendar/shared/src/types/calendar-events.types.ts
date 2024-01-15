export enum Kind {
  VTT = 'vtt',
}

export interface CalendarEvent {
  name: string;
  kind: Kind;
  date?: Date;
  city?: string;
  departement?: number;
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
}
