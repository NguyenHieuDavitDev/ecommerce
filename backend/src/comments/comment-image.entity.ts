// src/comments/comment-image.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Comment } from './comment.entity';

@Entity()
export class CommentImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(() => Comment, comment => comment.images, { onDelete: 'CASCADE' })
  comment: Comment;
}
