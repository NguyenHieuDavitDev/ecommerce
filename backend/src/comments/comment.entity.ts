// src/comments/comment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Product } from '../product/product.entity';
import { CommentImage } from './comment-image.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  text: string;

  @Column({ default: 0 })
  rating: number;

  @ManyToOne(() => Product, product => product.comments, { onDelete: 'CASCADE' })
  product: Product;

  @OneToMany(() => CommentImage, image => image.comment, { cascade: true })
  images: CommentImage[];

  @CreateDateColumn()
  createdAt: Date;
}
