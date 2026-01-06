import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateFlashsaleDto {
  @IsNotEmpty()
  title: string;

  @IsNumber()
  discountPrice: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  productId: number;
}
