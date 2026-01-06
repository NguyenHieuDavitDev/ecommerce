import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentImage } from './comment-image.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { User } from '../users/users.entity';
import { Product } from '../product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentImage, User, Product])],
  controllers: [CommentsController],
  providers: [CommentsService], // <- Chỉ service hợp lệ
})
export class CommentsModule {}
