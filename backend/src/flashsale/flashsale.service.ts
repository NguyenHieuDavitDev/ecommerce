// ------------------------ IMPORTS ------------------------

// Injectable: decorator của NestJS, biến class thành provider có thể inject vào module khác
import { Injectable } from '@nestjs/common';

// InjectRepository: decorator của TypeORM để inject Repository tương ứng với entity
import { InjectRepository } from '@nestjs/typeorm';

// Repository: lớp của TypeORM để thao tác CRUD với entity
// Like: toán tử SQL LIKE, dùng để search theo chuỗi
import { Repository, Like } from 'typeorm';

// Import entity Flashsale
import { Flashsale } from './flashsale.entity';

// Import DTO để validate dữ liệu khi tạo hoặc cập nhật flashsale
import { CreateFlashsaleDto } from './dto/create-flashsale.dto';
import { UpdateFlashsaleDto } from './dto/update-flashsale.dto';

// Import entity Product để liên kết flashsale với sản phẩm
import { Product } from '../product/product.entity';

// ------------------------ SERVICE CLASS ------------------------

@Injectable() // Biến FlashsaleService thành provider có thể inject
export class FlashsaleService {
  // ------------------------ CONSTRUCTOR ------------------------
  constructor(
    @InjectRepository(Flashsale)
    private flashsaleRepo: Repository<Flashsale>, // Repository thao tác dữ liệu Flashsale
    @InjectRepository(Product)
    private productRepo: Repository<Product>,     // Repository thao tác dữ liệu Product
  ) {}
  // Nguyên lý:
  // - NestJS DI inject sẵn các repository để service thao tác DB
  // - Repository của TypeORM cung cấp các phương thức find, save, remove...

  // ------------------------ CREATE ------------------------
  async create(dto: CreateFlashsaleDto) {
    // Tìm sản phẩm theo id từ DTO để liên kết với flashsale
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    // Nếu không tìm thấy sản phẩm → throw lỗi
    if (!product) throw new Error('Product not found');

    // Tạo một đối tượng flashsale mới từ DTO và gán product
    const flashsale = this.flashsaleRepo.create({
      ...dto,   // spread tất cả thuộc tính từ DTO
      product,  // liên kết entity Product
    });

    // Lưu flashsale vào DB
    return this.flashsaleRepo.save(flashsale);
    // save(): nếu entity có id tồn tại → update, nếu không → insert
  }

  // ------------------------ FIND ALL ------------------------
  async findAll(page = 1, limit = 10, search = '') {
    // findAndCount(): trả về [dữ liệu, tổng số bản ghi]
    const [data, total] = await this.flashsaleRepo.findAndCount({
      where: { title: Like(`%${search}%`) },  // tìm kiếm theo title với LIKE
      skip: (page - 1) * limit,               // offset cho pagination
      take: limit,                             // limit cho pagination
      order: { id: 'DESC' },                  // sắp xếp theo id giảm dần
    });

    // Trả về dữ liệu kèm tổng số, trang hiện tại và lastPage
    return { data, total, page, lastPage: Math.ceil(total / limit) };
    // lastPage tính bằng tổng số bản ghi / limit và làm tròn lên
  }

  // ------------------------ FIND ONE ------------------------
  findOne(id: number) {
    // Tìm flashsale theo id
    return this.flashsaleRepo.findOne({ where: { id } });
    // findOne(): trả về entity hoặc null nếu không tồn tại
  }

  // ------------------------ UPDATE ------------------------
  async update(id: number, dto: UpdateFlashsaleDto) {
    // Tìm flashsale theo id
    const flashsale = await this.flashsaleRepo.findOne({ where: { id } });
    if (!flashsale) throw new Error('Flashsale not found');

    // Nếu DTO có productId, tìm product tương ứng
    if (dto.productId) {
      const product = await this.productRepo.findOne({ where: { id: dto.productId } });
      if (!product) throw new Error('Product not found');
      flashsale.product = product!; // gán product mới cho flashsale
    }

    // Gán tất cả thuộc tính từ DTO vào entity flashsale hiện tại
    Object.assign(flashsale, dto);
    // Object.assign(): copy tất cả key từ DTO sang flashsale, ghi đè các giá trị cũ

    // Lưu entity đã cập nhật vào DB
    return this.flashsaleRepo.save(flashsale);
  }

  // ------------------------ REMOVE ------------------------
  async remove(id: number) {
    // Tìm flashsale theo id
    const flashsale = await this.flashsaleRepo.findOne({ where: { id } });
    if (!flashsale) throw new Error('Not found');

    // Xóa entity khỏi DB
    return this.flashsaleRepo.remove(flashsale);
    // remove(): xóa entity đã load từ DB, không xóa theo id trực tiếp
  }
}
