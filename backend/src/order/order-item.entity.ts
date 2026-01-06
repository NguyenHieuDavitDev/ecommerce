import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';

@Entity()
export class OrderItem {
  /*
  id:
  - Khóa chính của bảng order_items.
  - Tự tăng (auto-increment).
  - Mỗi dòng đại diện cho 1 sản phẩm trong 1 đơn hàng.
*/
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;
  /*
   product:
   - Quan hệ N-1 (ManyToOne) đến bảng products.
   - Mỗi OrderItem chỉ thuộc về đúng 1 Product.
   - Một Product có thể nằm trong rất nhiều OrderItem (nếu nhiều người mua).

   { eager: true }
   - mỗi lần query OrderItem, TypeORM sẽ tự động JOIN và trả về luôn product 
   mà không cần dùng leftJoin, leftJoinAndSelect, hoặc { relations: [...] }
   - Khi lấy OrderItem từ DB, Product sẽ được load kèm theo tự động.
   - để API trả về thông tin sản phẩm nhanh hơn (không cần gọi join thủ công).

   @JoinColumn({ name: 'product_id' })
   - Tạo cột product_id trong bảng order_items.
   - foreign key trỏ tới bảng products.
 */

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;
  /*
  price:
  - Giá sản phẩm tại thời điểm mua.
  - Không dùng price từ Product để tính toán vì giá có thể thay đổi theo thời gian.
  - Lưu giá lại giúp giữ lịch sử chính xác (ví dụ: khi tăng giá sản phẩm sau này).

  'decimal':
  - Loại dữ liệu chính xác cho tiền tệ.
  - precision: 10 là tổng số chữ số tối đa (99999999.99)
  - scale: 2 là số chữ số sau dấu phẩy.
*/

  @Column('int')
  quantity: number;
  /*
    quantity:
    - Số lượng sản phẩm người dùng mua.
    - Kiểu int là không có số thập phân.
  */

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;
  /*
  order:
  - Quan hệ N-1 (ManyToOne) đến bảng orders.
  - Mỗi OrderItem thuộc về 1 Order duy nhất.
  - Một đơn hàng có nhiều OrderItem
  (order) => order.items
  - Inverse side chỉ là bên mô tả quan hệ để TypeORM biết hai bảng liên kết với nhau.
  - là inverse side: Order.items sẽ chứa danh sách OrderItem.

  { onDelete: 'CASCADE' }
  - Nếu đơn hàng bị xóa thì tất cả OrderItem liên quan cũng xóa theo.
  - Đảm bảo không còn dữ liệu rác trong DB.
*/
}
