import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  stock?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  supplierId?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
