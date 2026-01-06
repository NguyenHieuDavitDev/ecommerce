import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/users.entity';


// Kiểu dữ liệu tùy chọn cho mục đích mã xác minh.
// Dùng union type để đảm bảo chỉ dùng đúng 3 giá trị (dùng nhiều kiểu dữ liệu).
export type VerificationPurpose = 'login' | 'register' | 'logout';


// Tạo bảng database tên là "verification_tokens"
@Entity('verification_tokens')
export class VerificationToken {

  // Tạo khóa chính dạng UUID (chuỗi 36 ký tự),
  // đảm bảo tính duy nhất và khó đoán hơn auto-increment.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Một token thuộc về một user (quan hệ N-1).
  // Nếu user bị xóa → tất cả token liên quan cũng bị xóa (CASCADE).
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;


  // Cột userId để lưu khóa ngoại của user.
  // TypeORM sẽ tự đồng bộ với trường quan hệ ManyToOne ở trên.
  @Column()
  userId: number;

  // Mã xác minh (OTP), ví dụ: "123456" hoặc mã ngẫu nhiên.
  @Column()
  code: string;



  // Column dạng ENUM để chỉ định mục đích của mã xác minh:
  // - login: xác thực khi đăng nhập
  // - register: xác minh khi đăng ký
  // - logout: bảo vệ thao tác đăng xuất (hoặc thiết bị)
  @Column({ type: 'enum', enum: ['login', 'register', 'logout'] })
  purpose: VerificationPurpose;


  // Thời gian token hết hạn (expiration)
  // Thường dùng cho OTP 3 phút, 5 phút...
  @Column({ type: 'datetime' })
  expiresAt: Date;


  // Đánh dấu token đã được sử dụng hay chưa.
  // Tránh trường hợp OTP bị xài lại (replay attack).
  @Column({ default: false })
  consumed: boolean;


  // Tự động lưu timestamp khi record được tạo.
  // Không cần set thủ công.
  @CreateDateColumn()
  createdAt: Date;
}


