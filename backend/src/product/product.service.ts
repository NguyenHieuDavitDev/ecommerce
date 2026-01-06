import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../category/entities/category.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage) private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Supplier) private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({ relations: ['images', 'category', 'supplier'] });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'category', 'supplier'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async create(dto: CreateProductDto) {
    const category = dto.categoryId
      ? await this.categoryRepo.findOneBy({ id: dto.categoryId })
      : null;
    const supplier = dto.supplierId
      ? await this.supplierRepo.findOneBy({ id: dto.supplierId })
      : null;

    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock ?? 0,
      category: category ?? undefined,
      supplier: supplier ?? undefined,
    });
    const saved = await this.productRepo.save(product);

    if (dto.images?.length) {
      const imgs = dto.images.map((url) =>
        this.imageRepo.create({ url, product: saved }),
      );
      await this.imageRepo.save(imgs);
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    Object.assign(product, dto);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      if (!category) throw new NotFoundException('Danh mục không tồn tại');
      product.category = category;
    }

    if (dto.supplierId) {
      const supplier = await this.supplierRepo.findOneBy({ id: dto.supplierId });
      if (!supplier) throw new NotFoundException('Nhà cung cấp không tồn tại');
      product.supplier = supplier;
    }

    const updated = await this.productRepo.save(product);

    if (dto.images?.length) {
      await this.imageRepo.delete({ product: { id } });
      const newImages = dto.images.map((url) =>
        this.imageRepo.create({ url, product: updated }),
      );
      await this.imageRepo.save(newImages);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
    return { message: 'Xóa sản phẩm thành công' };
  }
}
