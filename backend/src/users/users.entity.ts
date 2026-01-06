import { Entity, // Decorator đánh dấu class là một bảng (table) trong database
  PrimaryGeneratedColumn,  // Tạo cột khóa chính dạng tự tăng
  Column,   // Tạo cột dữ liệu bình thường
  CreateDateColumn, // Tự động tạo ngày tạo bản ghi
  UpdateDateColumn, // Tự động cập nhật ngày cập nhật bản ghi
  ManyToOne, // Quan hệ nhiều - một (Many Users → One Role)
  JoinColumn  // Xác định tên cột join giữa các bảng
} from 'typeorm';
import { Role } from '../roles/role.entity'; // Import entity Role để tạo quan hệ giữa User và Role

//  Khai báo Entity (bảng) tên "users"
@Entity('users') 

export class User { 
  
  // Khóa chính tự tăng
  @PrimaryGeneratedColumn()
  id: number;

  // Username là duy nhất – tránh trùng lặp
  @Column({ unique: true })
  username: string;


  // Mật khẩu (đã hash)
  @Column()
  password: string;

  // Email có thể null nhưng phải unique
  @Column({ unique: true, nullable: true })
  email?: string;

  // roleName lưu tên phân quyền (vd: 'admin', 'user'), dự phòng khi không join bảng Role
  @Column({ name: 'role_name', default: 'user' })
  roleName: string;

  // Lưu khóa ngoại trỏ đến bảng Role (role.id)
  @Column({ name: 'roleId', nullable: true })
  roleId?: number;


  // Many Users thì One Role  
  // Mỗi user có thể thuộc một role.
  // eager: true thì tự động load Role khi query User
  // nullable thì user có thể không có role
  // JoinColumn thì roleId sẽ là cột khóa ngoại
  @ManyToOne(
    () => Role,               // 1. Hàm callback trả về class Role để giúp TypeORM tránh lỗi vòng tham chiếu
    (role) => role.users,     // 2. Chỉ rõ quan hệ ngược thuộc tính "users" trong Role sẽ chứa danh sách User
    { 
      eager: true,            // 3. Tự động load Role mỗi khi query User (JOIN tự động)
      nullable: true          // 4 Cho phép cột roleId có thể rỗng thì User không bắt buộc phải có role
    }
  )
  @JoinColumn({ 
    name: 'roleId'            // 5. Tên cột khóa ngoại trong bảng users (FK → roles.id)
  })
  role?: Role;                // 6. Thuộc tính role là object Role đã được liên kết

  // Thông tin người dùng khi đặt đặt hàng
  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerPhone?: string;

  @Column({ nullable: true })
  customerAddress?: string;

  @Column({ nullable: true })
  dateOfBirth?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  avatarUrl?: string;


  // Danh sách địa chỉ JSON (nhiều địa chỉ)
  // Lưu dạng mảng object dạng simple-json
  @Column('simple-json', { nullable: true })
  addresses?: Array<{
    id: string;            // ID địa chỉ
    label?: string;        // Nhãn (Nhà riêng, Công ty,…)
    receiver: string;      // Người nhận hàng
    phone: string;         // Số điện thoại nhận hàng
    address: string;       // Địa chỉ chi tiết
    isDefault?: boolean;   // Có phải địa chỉ mặc định không
  }>;

  // Phương thức thanh toán JSON
  @Column('simple-json', { nullable: true })
  paymentMethods?: Array<{
    id: string;           // ID phương thức
    type: string;         // Loại (Momo, Visa,…)
    label?: string;       // Mô tả
    last4?: string;       // 4 số cuối thẻ
    isDefault?: boolean;  // Mặc định hay không
  }>;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
