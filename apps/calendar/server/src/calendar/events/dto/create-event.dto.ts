import { IsString, IsBoolean, IsDate } from 'class-validator';
import { Kind } from '../enums/kind.enum';
export class CreateEventDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly city: string;

  @IsString()
  readonly departement: string;

  @IsDate()
  readonly date: Date;

  @IsDate()
  readonly updatedAt: Date;

  @IsString()
  readonly organisateur: string;

  @IsString()
  readonly hour: string;

  @IsString()
  readonly website: string;

  @IsString()
  readonly place: string;

  @IsString()
  readonly price: string;

  @IsString()
  readonly contact: string;

  @IsString()
  readonly description: string;

  @IsString()
  readonly origin: string;

  @IsString()
  readonly kind: Kind;

  @IsBoolean()
  readonly canceled: boolean;

  @IsBoolean()
  readonly active?: boolean;
}
