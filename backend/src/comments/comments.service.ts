// src/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CommentImage } from './comment-image.entity';
import { Product } from '../product/product.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(CommentImage) private commentImageRepo: Repository<CommentImage>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

    // Lấy tất cả comment (ADMIN)
    async findAll() {
      return this.commentRepo.find({
        relations: ['images', 'product'],
        order: { createdAt: 'DESC' },
      });
    }
  // Tạo comment
  async createComment(productId: number, dto: CreateCommentDto, imagePaths: string[]) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const comment = this.commentRepo.create({
      username: dto.username,
      text: dto.text,
      rating: dto.rating || 0,
      product,
    });

    const savedComment = await this.commentRepo.save(comment);

    if (imagePaths?.length) {
      const images = imagePaths.map(url => this.commentImageRepo.create({ url, comment: savedComment }));
      await this.commentImageRepo.save(images);
      savedComment.images = images;
    }

    return savedComment;
  }

  // Lấy tất cả comment theo sản phẩm
  async getCommentsByProduct(productId: number) {
    return this.commentRepo.find({
      where: { product: { id: productId } },
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });
  }

  // Lấy comment theo ID
  async getCommentById(commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['images', 'product'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  // Cập nhật comment
  async updateComment(commentId: number, dto: UpdateCommentDto, imagePaths: string[]) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['images'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    comment.text = dto.text ?? comment.text;
    comment.rating = dto.rating ?? comment.rating;

    if (imagePaths?.length) {
      const newImages = imagePaths.map(url => this.commentImageRepo.create({ url, comment }));
      await this.commentImageRepo.save(newImages);
      comment.images = [...(comment.images || []), ...newImages];
    }

    return this.commentRepo.save(comment);
  }

  // Xóa comment
  async deleteComment(commentId: number) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId }, relations: ['images'] });
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.images?.length) {
      comment.images.forEach(img => {
        const filePath = join(process.cwd(), img.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await this.commentRepo.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}
