import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from './entities/supplier.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  // Lấy toàn bộ danh sách
  @Get()
  findAll() {
    return this.supplierService.findAll();
  }

  // Lấy một supplier theo ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(+id);
  }

  // Thêm mới supplier (có upload ảnh)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/suppliers',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<Supplier>,
  ) {
    const data: Partial<Supplier> = {
      ...body,
      image: file ? `/uploads/suppliers/${file.filename}` : null,
    };
    return await this.supplierService.create(data);
  }

  // Cập nhật supplier (có thể có ảnh mới hoặc giữ nguyên ảnh cũ)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/suppliers',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<Supplier>,
  ) {
    // Nếu không có file mới thì giữ nguyên ảnh cũ
    const existing = await this.supplierService.findOne(+id);

    const data: Partial<Supplier> = {
      ...existing,
      ...body,
      image: file
        ? `/uploads/suppliers/${file.filename}`
        : existing?.image || null,
    };

    return await this.supplierService.update(+id, data);
  }

  // Xóa supplier
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.supplierService.remove(+id);
  }
}
