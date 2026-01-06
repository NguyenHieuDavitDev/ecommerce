import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Product } from '../../product/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  // Thêm quan hệ với Product
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
