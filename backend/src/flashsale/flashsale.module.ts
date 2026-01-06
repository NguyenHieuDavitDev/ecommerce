import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashsale } from './flashsale.entity';
import { FlashsaleService } from './flashsale.service';
import { FlashsaleController } from './flashsale.controller';
import { Product } from '../product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flashsale, Product])],
  controllers: [FlashsaleController],
  providers: [FlashsaleService],
})
export class FlashsaleModule {}
