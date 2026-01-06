import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async findAll() {
    return this.repo.find({ relations: ['parent', 'children'] });
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['parent', 'children'] });
  }

  async create(data: Partial<Category>) {
    const category = this.repo.create(data);
    return this.repo.save(category);
  }

  async update(id: number, data: Partial<Category>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
}
