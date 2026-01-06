// ------------------------ IMPORTS ------------------------

// Các decorator HTTP và metadata từ NestJS
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
// Controller: biến class thành controller, xử lý các route HTTP
// Get, Post, Put, Delete: định nghĩa route HTTP method tương ứng
// Body: decorator lấy dữ liệu từ body của request
// Param: decorator lấy dữ liệu từ route parameter
// Query: decorator lấy dữ liệu từ query string của URL

// Import service Flashsale
import { FlashsaleService } from './flashsale.service';

// Import DTO để validate dữ liệu từ request
import { CreateFlashsaleDto } from './dto/create-flashsale.dto';
import { UpdateFlashsaleDto } from './dto/update-flashsale.dto';

// ------------------------ CONTROLLER ------------------------

@Controller('flashsales') // Tất cả route trong controller này sẽ bắt đầu bằng '/flashsales'
export class FlashsaleController {

  // Constructor inject service FlashsaleService nhờ DI
  constructor(private readonly flashsaleService: FlashsaleService) {}
  // private readonly: biến chỉ đọc trong class, được NestJS DI tự động khởi tạo

  // ------------------------ CREATE ------------------------
  @Post() // HTTP POST /flashsales
  create(@Body() dto: CreateFlashsaleDto) {
    // @Body(): lấy dữ liệu JSON từ body request
    // Gọi service để tạo flashsale mới
    return this.flashsaleService.create(dto);
  }

  // ------------------------ FIND ALL ------------------------
  @Get() // HTTP GET /flashsales
  findAll(
    @Query('page') page: number,   // Lấy page từ query string ?page=1
    @Query('limit') limit: number, // Lấy limit từ query string ?limit=10
    @Query('search') search: string, // Lấy search từ query string ?search=abc
  ) {
    // Gọi service để lấy danh sách flashsale có phân trang và tìm kiếm
    return this.flashsaleService.findAll(page, limit, search);
  }

  // ------------------------ FIND ONE ------------------------
  @Get(':id') // HTTP GET /flashsales/:id
  findOne(@Param('id') id: number) {
    // @Param('id'): lấy id từ URL
    // Gọi service để lấy flashsale theo id
    return this.flashsaleService.findOne(id);
  }

  // ------------------------ UPDATE ------------------------
  @Put(':id') // HTTP PUT /flashsales/:id
  update(@Param('id') id: number, @Body() dto: UpdateFlashsaleDto) {
    // @Param('id'): lấy id từ URL
    // @Body(): lấy dữ liệu cập nhật từ request body
    // Gọi service để cập nhật flashsale
    return this.flashsaleService.update(id, dto);
  }

  // ------------------------ REMOVE ------------------------
  @Delete(':id') // HTTP DELETE /flashsales/:id
  remove(@Param('id') id: number) {
    // @Param('id'): lấy id từ URL
    // Gọi service để xóa flashsale
    return this.flashsaleService.remove(id);
  }
}
