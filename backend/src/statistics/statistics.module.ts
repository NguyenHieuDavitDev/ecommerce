import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Order } from '../order/order.entity';
import { User } from '../users/users.entity';
import { Product } from '../product/product.entity';
import { Blog } from '../blogs/blog.entity';
import { Comment } from '../comments/comment.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Product, Blog, Comment, Supplier, Category])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}

