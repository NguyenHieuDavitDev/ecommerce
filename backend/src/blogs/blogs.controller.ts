import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs') // Controller xử lý tất cả request có path bắt đầu bằng "/blogs"     
export class BlogsController { // Controller Blogs đại diện cho endpoint "/blogs".
  constructor(private readonly blogsService: BlogsService) {}   // Inject BlogsService để controller gọi xử lý logic chính  

  @Get() // Endpoint "/blogs" để lấy tất cả bài viết.   
  findAll(@Query('page') page = '1', @Query('limit') limit = '10', @Query('search') search?: string) { // Lấy tất cả bài viết.  
    return this.blogsService.findAll(+page, +limit, search);  // Gọi service, ép kiểu page/limit thành số bằng +
  }
  // Query param page, mặc định = 1
  // Query param limit, mặc định = 10
  // Query param search (tìm kiếm)

  @Get('featured') 
  // @Get('featured'):
// - Tạo một endpoint GET tại đường dẫn: /blogs/featured
// - 'featured' là segment URL, nghĩa là client sẽ gọi: GET /blogs/featured
// - Chỉ xử lý các request GET (không nhận body).
// - Gọi service để lấy danh sách bài viết nổi bật.
  findFeatured() { 
    // Hàm controller được gọi khi client truy cập endpoint này.
    return this.blogsService.findFeatured(); 
    // Gọi service blogsService.findFeatured()
    // Service xử lý logic lấy danh sách bài viết có featured = true.
    // Trả về danh sách bài viết có featured = true.
  }

  @Get(':id') // Endpoint "/blogs/:id" để lấy bài viết theo id.
  // @Get(':id'):
  // - Tạo endpoint GET động với tham số URL.
  // - ":id" là route parameter (biến động trong URL).
  // - Khi người dùng gọi GET /blogs/10 → id = "10".
 
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(+id);
     // Gọi service blogsService.findOne(+id)
    // Service xử lý logic lấy bài viết theo id.
    // Trả về bài viết theo id.
  }

  @Post() // Endpoint "/blogs" để tạo bài viết mới.
  // @Post():
  // - Tạo endpoint POST để tạo bài viết mới.
  // - Chỉ xử lý các request POST (nhận body).
  // - Gọi service blogsService.create(payload)
  // Service xử lý logic tạo bài viết mới.
  // Trả về bài viết mới.
  @UseInterceptors(FilesInterceptor('images', 10, getMulterConfig())) // Interceptor để xử lý upload file.
  create(@Body() createBlogDto: CreateBlogDto, @UploadedFiles() files: Express.Multer.File[]) { // Tạo bài viết mới.
    const payload = this.buildPayload(createBlogDto, files); // Xử lý dữ liệu từ client.
    return this.blogsService.create(payload); // Gọi service, tạo bài viết mới.
  }

  @Put(':id') // Endpoint "/blogs/:id" để cập nhật bài viết theo id.
  // @Put(':id'):
  // - Tạo endpoint PUT để cập nhật bài viết theo id.
  // - ":id" là route parameter (biến động trong URL).
  // - Khi người dùng gọi PUT /blogs/10 → id = "10".
  // - Chỉ xử lý các request PUT (nhận body).
  // - Gọi service blogsService.update(+id, payload)
  // Service xử lý logic cập nhật bài viết theo id.
  // Trả về bài viết đã cập nhật.
  @UseInterceptors(FilesInterceptor('images', 10, getMulterConfig())) // Interceptor để xử lý upload file.
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto, @UploadedFiles() files: Express.Multer.File[]) { // Cập nhật bài viết theo id.
    const payload = this.buildPayload(updateBlogDto, files); // Xử lý dữ liệu từ client.
    return this.blogsService.update(+id, payload); // Gọi service, cập nhật bài viết theo id.
  }

  @Delete(':id') // Endpoint "/blogs/:id" để xóa bài viết theo id.
  // @Delete(':id'):
  // - Tạo endpoint DELETE để xóa bài viết theo id.
  // - ":id" là route parameter (biến động trong URL).
  // - Khi người dùng gọi DELETE /blogs/10 → id = "10".
  // - Chỉ xử lý các request DELETE (không nhận body).
  // - Gọi service blogsService.remove(+id)
  // Service xử lý logic xóa bài viết theo id.
  // Trả về bài viết đã xóa.
  remove(@Param('id') id: string) { // Xóa bài viết theo id.
    return this.blogsService.remove(+id); // Gọi service, xóa bài viết theo id.
  }

  private buildPayload(dto: CreateBlogDto | UpdateBlogDto, files?: Express.Multer.File[]) { // Xử lý dữ liệu từ client.
    const { currentImages, ...rest } = dto as any; // Parse dữ liệu từ client.
    const existingImages = this.parseImages(currentImages || rest.images); // Parse ảnh từ client.
    const uploadedImages = (files || []).map((file) => `/uploads/blogs/${file.filename}`); // Parse ảnh từ client.
    const mergedImages = [...existingImages, ...uploadedImages];
    return { // Trả về dữ liệu từ client.
      ...rest,
      featured: this.toBoolean(rest.featured), // Parse featured từ client.
      images: mergedImages, // Parse ảnh từ client.
      image: mergedImages[0] ?? rest.image ?? undefined, // Parse ảnh từ client.
    };
  } // Trả về dữ liệu từ client.

  private parseImages(value?: string | string[]): string[] { // Parse ảnh từ client.    
    if (!value) return []; // Nếu không có ảnh, trả về mảng rỗng.
    if (Array.isArray(value)) return value; // Nếu là mảng, trả về mảng.
    try {
      const parsed = JSON.parse(value); // Parse ảnh từ client.
      return Array.isArray(parsed) ? parsed : []; // Nếu là mảng, trả về mảng.
    } catch {
      return value ? [value] : []; // Nếu không phải là mảng, trả về mảng với 1 phần tử.
    }
  }

  private toBoolean(value: any): boolean { // Parse boolean từ client.
    if (typeof value === 'boolean') return value; // Nếu là boolean, trả về boolean.
    if (typeof value === 'string') return value === 'true' || value === '1'; // Nếu là string, trả về true nếu value là 'true' hoặc '1'.
    return !!value; // Nếu không phải là boolean, trả về true nếu value là true.
  } // Trả về boolean.
}

function getMulterConfig() { // Config multer để xử lý upload file. 
  return {
    storage: diskStorage({ // Config storage để xử lý upload file.
      destination: './uploads/blogs', // Config destination để xử lý upload file.
      filename: (_, file, cb) => { // Config filename để xử lý upload file.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9); // Tạo tên file unique.
        const ext = extname(file.originalname); // Lấy extension của file.
        cb(null, `blog-${uniqueSuffix}${ext}`); // Tạo tên file unique.
      },
    }),
  };
}
