import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../product/product.entity';
import { PaymentTransaction } from './payment-transaction.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Order, OrderItem, Product, PaymentTransaction])],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}

