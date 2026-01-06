import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Category } from '../category/entities/category.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, Category, Supplier])],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [TypeOrmModule], 
})
export class ProductModule {}
