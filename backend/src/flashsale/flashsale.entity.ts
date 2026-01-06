// ------------------------ IMPORTS ------------------------

// Entity: decorator đánh dấu class này là entity, ánh xạ tới bảng trong DB
// PrimaryGeneratedColumn: tạo cột id tự tăng (primary key, auto-increment)
// Column: tạo cột trong bảng DB với các tuỳ chọn như type, nullable...
// ManyToOne: tạo quan hệ nhiều-đến-một giữa 2 entity
// JoinColumn: xác định cột foreign key dùng để join
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import entity Product để liên kết flashsale với sản phẩm
import { Product } from '../product/product.entity';

// ------------------------ ENTITY FLASHSALE ------------------------

@Entity() // Biến class thành entity tương ứng với 1 bảng trong DB
export class Flashsale {

  // ------------------------ PRIMARY KEY ------------------------
  @PrimaryGeneratedColumn()
  id: number;
  // id: primary key tự tăng
  // TypeORM sẽ tạo cột INT AUTO_INCREMENT trong DB

  // ------------------------ TITLE ------------------------
  @Column({ nullable: false })
  title: string;
  // title: tên flashsale
  // nullable: false → cột không thể null
  // default type: varchar(255) trong DB

  // ------------------------ DISCOUNT PRICE ------------------------
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  discountPrice: number;
  // discountPrice: giá giảm của sản phẩm
  // type: 'decimal' → dùng cho số thập phân chính xác
  // precision: tổng số chữ số, scale: số chữ số thập phân
  // nullable: false → cột bắt buộc phải có giá trị

  // ------------------------ START TIME ------------------------
  @Column({ type: 'datetime', nullable: false })
  startTime: Date;
  // startTime: thời gian bắt đầu flashsale
  // type: 'datetime' → lưu ngày giờ
  // nullable: false → không được để trống

  // ------------------------ END TIME ------------------------
  @Column({ type: 'datetime', nullable: false })
  endTime: Date;
  // endTime: thời gian kết thúc flashsale
  // type: 'datetime', nullable: false

  // ------------------------ RELATION TO PRODUCT ------------------------
  @ManyToOne(() => Product, (product) => product.flashsales, { eager: true })
  // ManyToOne: nhiều flashsale liên kết với 1 product
  // () => Product: lazy function để TypeORM nhận entity Product
  // (product) => product.flashsales: inverse side của quan hệ
  // eager: true → khi load flashsale, tự động load luôn product (join query)

  @JoinColumn({ name: 'productId' })
  // JoinColumn xác định cột foreign key trong bảng flashsale là productId
  // productId sẽ lưu id của product tương ứng

  product: Product;
  // property product kiểu Product
  // TypeORM tự động map foreign key productId tới entity Product
}
