import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity() 
export class Blog { // Entity Blog đại diện cho bảng "blog" trong database.
  @PrimaryGeneratedColumn() 
  id: number;  // Khóa chính (primary key), tự động tăng (AUTO_INCREMENT).

  @Column()     
  title: string; // Cột title, dạng string (VARCHAR), tiêu đề bài viết.

  @Column('text') 
  content: string; // Cột content, kiểu TEXT, lưu nội dung dài của bài viết.


  @Column({ nullable: true }) 
  image?: string; // Cột image (ảnh đại diện). Cho phép null: bài viết có thể không có ảnh.

  @Column('simple-json', { nullable: true })
  images?: string[]; 
  // Cột images, lưu mảng chuỗi dưới dạng JSON.
  // lưu dạng JSON text trong database, ví dụ: ["a.jpg","b.jpg"].
  // Cho phép null.


  @Column({ default: false })
  featured: boolean; 
  // Cột featured, kiểu boolean.
  // Mặc định = false.
  // Dùng để gắn tag "nổi bật" cho bài viết.

  @CreateDateColumn()
  createdAt: Date;  // Thời điểm bài viết được tạo.
  // Tự động set bởi TypeORM, không cần truyền từ client.

  @UpdateDateColumn()
  updatedAt: Date; // Thời điểm bài viết được cập nhật gần nhất.
  // Tự động cập nhật mỗi khi bản ghi được update.
}
