import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const imageUrls = files.images?.map(
      (f) => `/uploads/products/${f.filename}`,
    );
    return this.productService.create({ ...dto, images: imageUrls });
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const imageUrls = files.images?.map(
      (f) => `/uploads/products/${f.filename}`,
    );
    return this.productService.update(id, { ...dto, images: imageUrls });
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
  
}
