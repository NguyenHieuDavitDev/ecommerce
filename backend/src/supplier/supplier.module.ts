import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { Supplier } from './entities/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])], 
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService], // (tuỳ chọn, nếu dùng ở module khác)
})
export class SupplierModule {}
