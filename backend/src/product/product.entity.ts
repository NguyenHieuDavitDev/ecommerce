import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { ProductImage } from './product-image.entity';
import { Flashsale } from '../flashsale/flashsale.entity';
import { Comment } from 'src/comments/comment.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  category: Category;

  @ManyToOne(() => Supplier, (supplier) => supplier.products, { eager: true })
  supplier: Supplier;


  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images: ProductImage[];

  @OneToMany(() => Flashsale, (flashsale) => flashsale.product)
  flashsales: Flashsale[]
  
  @OneToMany(() => Comment, (comment) => comment.product)
  comments: Comment[];
}
