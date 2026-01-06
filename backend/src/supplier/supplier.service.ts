import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find();
  }

  async findOne(id: number): Promise<Supplier | null> {
    return this.supplierRepository.findOneBy({ id });
  }

  async create(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(data);
    return await this.supplierRepository.save(supplier);
  }

  async update(id: number, data: Partial<Supplier>): Promise<Supplier | null> {
    await this.supplierRepository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.supplierRepository.delete(id);
  }
}
