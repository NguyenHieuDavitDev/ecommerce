import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { PaymentMethod } from './order.constants';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
/*
  Enum OrderStatus đại diện trạng thái đơn hàng:
  - PENDING: đơn mới tạo, chưa thanh toán
  - PAID: đã thanh toán
  - CANCELLED: đã hủy
*/

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;
  /*
  id: Khóa chính auto-increment
  - Mỗi đơn hàng có id duy nhất
*/


  @Column()
  customerName: string;
  /*
  customerName: Tên khách hàng
  - Bắt buộc
  - Kiểu string
*/

  @Column()
  customerPhone: string;
  /*
  customerPhone: Số điện thoại liên hệ
  - Bắt buộc
  - Kiểu string (để giữ số 0 đầu và các ký tự đặc biệt)
*/

  @Column()
  customerAddress: string;
  /*
  customerAddress: Địa chỉ giao hàng
  - Bắt buộc
  - Kiểu string
*/

  @Column({ nullable: true })
  customerEmail?: string;
  /*
  customerEmail: Email khách hàng
  - Không bắt buộc, nullable
  - Có thể dùng để gửi thông báo đơn hàng
*/

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;
  /*
  totalAmount: Tổng tiền của đơn hàng
  - Kiểu decimal
  - precision: tổng số chữ số tối đa (10)
  - scale: số chữ số sau dấu thập phân (2)
  - Lưu giá trị tổng tiền tại thời điểm tạo đơn (không lấy từ product.price trực tiếp)
*/

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;
  /*
  status: trạng thái đơn hàng
  - Dùng enum OrderStatus
  - default = PENDING
  - TypeORM sẽ lưu dưới dạng string ('PENDING', 'PAID', 'CANCELLED')
*/

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;
  /*
   paymentMethod: phương thức thanh toán
   - Dùng enum PaymentMethod
   - default = COD
   - Có thể mở rộng thêm MOMO, VNPay, Paypal...
 */

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];
  /*
  items: danh sách các sản phẩm trong đơn hàng
  - Quan hệ 1-n với OrderItem
  - cascade: true → khi save/update order, tự động save/update các item
  - eager: true → khi lấy order, items được load tự động
*/

  @CreateDateColumn()
  createdAt: Date;
  /*
  createdAt: thời gian tạo đơn hàng
  - @CreateDateColumn(): tự động gán thời gian khi insert record
*/

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  momoPaymentUrl: string | null;
  /*
  momoPaymentUrl: URL thanh toán qua MoMo (nếu có)
  - Nullable, default null
  - Dùng để lưu link redirect khách hàng thanh toán MOMO
*/
}