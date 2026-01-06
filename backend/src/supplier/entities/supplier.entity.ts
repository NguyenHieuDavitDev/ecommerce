import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Product } from '../../product/product.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  image: string | null;

  // Quan hệ ngược với Product
  @OneToMany(() => Product, (product: Product) => product.supplier)
  products: Product[];
}
