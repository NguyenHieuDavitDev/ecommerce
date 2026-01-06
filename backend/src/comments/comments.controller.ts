import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const uploadConfig = {
  storage: diskStorage({
    destination: './uploads/comments',
    filename: (req, file, cb) => {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  },
};

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ADMIN GET ALL COMMENTS — FIX 404
  @Get('/comments')
  findAll() {
    return this.commentsService.findAll();
  }

  // GET COMMENTS BY PRODUCT
  @Get('/products/:productId/comments')
  getByProduct(@Param('productId') id: number) {
    return this.commentsService.getCommentsByProduct(id);
  }

  // CREATE COMMENT
  @Post('/products/:productId/comments')
  @UseInterceptors(FilesInterceptor('images', 10, uploadConfig))
  createComment(
    @Param('productId') productId: number,
    @Body() dto: CreateCommentDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const paths = files?.map(f => f.path) || [];
    return this.commentsService.createComment(productId, dto, paths);
  }

  // UPDATE COMMENT
  @Patch('/comments/:commentId')
  @UseInterceptors(FilesInterceptor('images', 10, uploadConfig))
  updateComment(
    @Param('commentId') commentId: number,
    @Body() dto: UpdateCommentDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const paths = files?.map(f => f.path) || [];
    return this.commentsService.updateComment(commentId, dto, paths);
  }

  // DELETE COMMENT
  @Delete('/comments/:commentId')
  deleteComment(@Param('commentId') id: number) {
    return this.commentsService.deleteComment(id);
  }
}
