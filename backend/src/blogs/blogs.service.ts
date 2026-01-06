import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Blog } from './blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService { // Service Blogs đại diện cho endpoint "/blogs".
  constructor(
    @InjectRepository(Blog) // Inject Repository Blog để service gọi xử lý logic chính.
    private blogsRepository: Repository<Blog>, // Repository Blog đại diện cho bảng "blog" trong database.
  ) {}

  async findAll(  
    page = 1,                 // page: số trang hiện tại. Mặc định = 1.
                             //  kiểu phân trang dạng (1-based index).
                             // Nếu client không truyền page, hàm vẫn hoạt động đúng.
  
    limit = 10,               // limit: số bài viết trên mỗi trang. Mặc định = 10.
                             // Dùng để giới hạn lượng dữ liệu trả về (pagination).
  
    search?: string,          // search: từ khóa tìm kiếm. Dạng optional (có thể undefined).
                             // Nếu client gửi ?search=abc. tìm bài viết có "abc" trong title.
  ): Promise<{               // Hàm trả về một Object có 4 trường:
    data: Blog[];            // - data: danh sách bài viết đã phân trang
    total: number;           // - total: tổng số bài viết thỏa điều kiện
    page: number;            // - page: trang hiện tại
    limit: number;           // - limit: số bài trên mỗi trang
  }> {
  
    // phân trang:
    // skip = số lượng bản ghi cần bỏ qua để lấy trang tiếp theo.
    // Ví dụ: page = 2 thì skip = (2 - 1) * 10 = 10 → bỏ qua 10 bài đầu.
    const skip = (page - 1) * limit;
  
    // Tạo điều kiện WHERE cho truy vấn SQL.
    // Nếu có search → tìm bài có title chứa từ khóa search (LIKE %keyword%)
    // Nếu không có search → where = {} (không lọc gì cả)
    const where = search
      ? { title: Like(`%${search}%`) }   // search SQL LIKE
      : {};                              // không dùng điều kiện SEARCH
      // SELECT * FROM blog
      // WHERE title LIKE '%search%'
      // ORDER BY createdAt DESC
      // LIMIT ? OFFSET ?;
      

    // findAndCount():
    // - Trả về 2 giá trị: [data, total]
    // - data: danh sách bản ghi sau phân trang
    // - total: tổng số bản ghi (không tính phân trang)
    const [data, total] = await this.blogsRepository.findAndCount({
      where,                              // Điều kiện WHERE (search)
      order: { createdAt: 'DESC' },       // Sắp xếp bài viết mới nhất lên đầu
      skip,                               // Số lượng bài viết cần bỏ qua
      take: limit,                        // Lấy đúng số bài viết theo limit
    });
  
    // Trả kết quả về client
    return {
      data,                               // Mảng bài viết sau phân trang
      total,                              // Tổng số bài viết tìm được
      page,                               // Trang hiện tại
      limit,                              // Số lượng bài viết mỗi trang
    };
  }
  

  findFeatured(): Promise<Blog[]> { 
    // Hàm findFeatured()
    // - Trả về danh sách các bài viết nổi bật (featured = true).
    // - Kiểu trả về: Promise<Blog[]> vì thao tác truy vấn DB là bất đồng bộ.
  
    return this.blogsRepository.find({ 
      // Gọi phương thức .find() của TypeORM Repository.
      // - Dùng để lấy nhiều bản ghi từ bảng Blog.
      // - lọc theo điều kiện.
  
      where: { featured: true },     
      // where:
      // - Điều kiện lọc bản ghi.
      // - Chỉ lấy những blog có cột "featured" = true.
      // - giống câu lệnh trong SQL:
      //     WHERE featured = true
  
      order: { createdAt: 'DESC' },  
      // order:
      // - Sắp xếp kết quả theo cột createdAt.
      // - 'DESC' sắp xếp giảm dần bài mới nhất nằm đầu danh sách.
      // - giống câu lệnh SQL:
      //     ORDER BY createdAt DESC
    }); 
    // Trả về danh sách Blog[] đã lọc và sắp xếp.
  }
  
  async findOne(id: number): Promise<Blog> {  
    // lấy ra một bài viết theo id duy nhất.
    // id: số nguyên, khóa chính của bài viết.
    // hàm trả về một Promise chứa một Blog.
  
    const blog = await this.blogsRepository.findOneBy({ id });  
    // tìm 1 bản ghi theo điều kiện WHERE.
    // - findOneBy({ id }) giống SQL:
    //     SELECT * FROM blog WHERE id = ? LIMIT 1;

  
    if (!blog)  
      throw new NotFoundException(`Blog #${id} not found`);  
    // Kiểm tra nếu blog không tồn tại:
    // - !blog nghĩa là null hoặc undefined.
    // - NotFoundException: lỗi HTTP 404 (NestJS Exception).
    // - Thông báo dạng template string: Blog #id not found
  
    return blog;  
    // Trả về bài viết tìm được.
    // Nếu tới được dòng này nghĩa là blog đã tồn tại và không bị throw lỗi.
  }


  async create(createBlogDto: CreateBlogDto): Promise<Blog> { 
    // Hàm create() dùng để tạo mới một bài viết (Blog).
    // Tham số:
    // - createBlogDto: chứa dữ liệu bài viết được gửi từ client.
    // Trả về: một Promise Blog sau khi đã lưu vào database.
  
    const payload: Partial<Blog> = { 
      // Tạo một object "payload" với kiểu Partial<Blog> 
      // Partial giúp tất cả thuộc tính của Blog thành tùy chọn.
      // dùng để chuẩn hóa dữ liệu đầu vào trước khi đưa vào repository.
  
      title: createBlogDto.title, 
      // Lấy tiêu đề bài viết từ client gửi lên.
  
      content: createBlogDto.content, 
      // Lấy nội dung bài viết từ client.
  
      featured: !!createBlogDto.featured, 
      // Chuyển giá trị 'featured' thành kiểu boolean.
      // - Nếu createBlogDto.featured = true thì featured = true
      // - Nếu là undefined/null/0 thì featured = false
      // để dữ liệu lưu vào DB là kiểu boolean.
  
      images: createBlogDto.images ?? [], 
      // Gán danh sách ảnh của bài viết.
      // Nếu client không gửi images (undefined hoặc null),
      // thì mặc định sẽ là mảng rỗng [].
  
      image: createBlogDto.image 
        ?? createBlogDto.images?.[0] 
        ?? undefined,
      // Ảnh đại diện (thumbnail) của bài viết.
      //  Nếu client gửi "image" thì dùng image.
      // Nếu không có image nhưng có images thì lấy ảnh đầu tiên trong mảng images.
      // Nếu không có gì thì undefined (không thiết lập ảnh đại diện).
    }; 
  
    const blog = this.blogsRepository.create(payload); 
    // Tạo một thực thể Blog mới từ payload.
    // create() KHÔNG lưu vào DB, mà chỉ tạo object Blog.
  
    return this.blogsRepository.save(blog); 
    // Lưu bài viết mới vào database.
    // Trả về chính object Blog sau khi đã được lưu.
  }
  

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<Blog> { 
      // Hàm update dùng để cập nhật bài viết theo id.
      // Tham số:
      // - id: số nguyên đại diện cho ID bài viết cần cập nhật.
      // - updateBlogDto: dữ liệu cập nhật được gửi từ client.

    const blog = await this.blogsRepository.findOne({ where: { id } }); 
      // Tìm bài viết theo ID trong cơ sở dữ liệu.
    // Trả về: Blog hoặc null nếu không tìm thấy.

    if (!blog) throw new NotFoundException(`Blog #${id} not found`); 
    // Nếu không tìm thấy, ném ra lỗi 404: "Blog #id not found".

    if (updateBlogDto.title !== undefined) blog.title = updateBlogDto.title; 
    // Nếu client gửi trường "title", thì cập nhật tiêu đề bài viết.

    if (updateBlogDto.content !== undefined) blog.content = updateBlogDto.content;
    // Nếu client gửi trường "content", thì cập nhật nội dung bài viết.

    if (updateBlogDto.featured !== undefined) blog.featured = !!updateBlogDto.featured;
    // Nếu client gửi "featured", chuyển về boolean rồi cập nhật.
    // !! để đảm bảo giá trị đúng kiểu boolean.

    if (updateBlogDto.images) { 
    // Nếu client gửi danh sách images (mảng ảnh mới):

      blog.images = updateBlogDto.images; // Cập nhật lại danh sách ảnh của bài viết.


      blog.image = updateBlogDto.images[0] ?? undefined;     // Ảnh đại diện sẽ là ảnh đầu tiên trong danh sách.
      // Nếu mảng rỗng thì trả ra undefined.


    } else if (updateBlogDto.image !== undefined) {     // Nếu client KHÔNG gửi images nhưng lại gửi "image":
      blog.image = updateBlogDto.image;     // Cập nhật ảnh đại diện theo giá trị từ clinet.

    }
    return this.blogsRepository.save(blog);   // Lưu bài viết đã cập nhật vào database.
    // Trả về bản ghi sau khi cập nhật xong.
  }

  async remove(id: number): Promise<void> { 
    // Hàm remove để xóa bài viết theo id.
    // Tham số:
    // - id: số nguyên đại diện cho ID bài viết cần xóa.
    // Trả về: Promise vì xóa xong không cần trả dữ liệu.
  
    const blog = await this.findOne(id); 
    // Gọi hàm findOne để kiểm tra bài viết có tồn tại không.
    // Nếu không tồn tại, findOne sẽ tự throw lỗi NotFoundException.
  
    if (!blog) throw new NotFoundException(`Blog #${id} not found`); 
    // Trường hợp phòng ngừa (redundant), đảm bảo không bị lỗi khi blog = null.
  
    await this.blogsRepository.remove(blog); 
    // Xóa bài viết khỏi database.
    // remove() yêu cầu truyền vào 1 entity đã được load từ DB.
  }
  
}


