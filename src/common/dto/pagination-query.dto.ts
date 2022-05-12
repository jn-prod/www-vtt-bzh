import { IsOptional, IsPositive, IsObject, IsString } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  limit: number;

  @IsOptional()
  @IsPositive()
  skip: number;

  @IsOptional()
  @IsString()
  projection: string;

  @IsOptional()
  @IsObject()
  sort: any;

  @IsOptional()
  @IsObject()
  filter: any;
}
