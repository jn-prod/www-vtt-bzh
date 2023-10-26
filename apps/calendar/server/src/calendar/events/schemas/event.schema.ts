import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Kind } from '../enums/kind.enum';
import { generateID } from 'src/common/utils/id';
@Schema()
export class CalendarEvent extends Document {
  @Prop()
  name: string;
  @Prop()
  city: string;
  @Prop()
  departement: string;
  @Prop()
  date: Date;
  @Prop()
  updatedAt: Date;
  @Prop()
  organisateur: string;
  @Prop()
  hour: string;
  @Prop()
  website: string;
  @Prop()
  place: string;
  @Prop()
  price: string;
  @Prop()
  contact: string;
  @Prop({ unique: true, default: generateID() })
  origin: string;
  @Prop()
  kind: Kind;
  @Prop()
  description: string;
  @Prop()
  canceled: boolean;
  @Prop({ default: true })
  active: boolean;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);
