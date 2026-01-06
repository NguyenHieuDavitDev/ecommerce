import { IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsString, Min, ArrayMinSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../order.constants';

// DTO cho từng sản phẩm trong đơn hàng
export class OrderItemDto {

  /*
  @IsNumber()
  - Bộ kiểm tra (validator) từ class-validator.
  - để giá trị gửi từ client phải là kiểu số.
  - Nếu không phải số (ví dụ: string, null, undefined),thì sẽ báo lỗi 400.

  @Type(() => Number)
  - Class-transformer: tự động chuyển kiểu dữ liệu về number.
  - Vì HTTP request nhận tất cả từ client dưới dạng string,
    nên cần ép kiểu để đảm bảo dữ liệu đúng trước khi kiểm tra.
  
  @Min(1)
  - Ràng buộc "phải >= 1".
  - Tránh trường hợp productId = 0 hoặc < 0 (không hợp lệ).
  - message: thông báo lỗi trả về cho người dùng.
*/


  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'productId phải lớn hơn hoặc bằng 1' })
  productId: number;



  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Số lượng sản phẩm phải lớn hơn hoặc bằng 1' })
  quantity: number;



  /*
  
    - Số lượng = 0 có nghĩa là đơn hàng.
    - Số lượng âm thì sai logic (không thể mua -3 sản phẩm).
    
    NestJS sẽ tự động:
      - Parse quantity từ string sang number.
      - Kiểm tra xem có phải số hợp lệ không.
      - Kiểm tra ≥ 1.
      - Nếu sai thì trả lỗi với HTTP 400 + message bên dưới.
  */
}

// DTO cho toàn bộ đơn hàng
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  customerName: string;
  /*
  customerName:
  - Tên người mua hàng.
  - @IsString(): bắt buộc phải là chuỗi.
  - @IsNotEmpty(): không được để trống. Ngăn trường hợp người dùng gửi "" hoặc null.

  -> Nếu client gửi sai: API trả lỗi 400 kèm message đã cấu hình.
*/

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  customerPhone: string;
  /*
  customerPhone:
  - Số điện thoại liên hệ để ship hàng.
  - @IsString(): shipper lấy số điện thoại dạng chuỗi, không ép về số
    vì nhiều số điện thoại bắt đầu bằng 0.

  - @IsNotEmpty(): không được để trống, đảm bảo đơn hàng có thông tin liên hệ.
*/

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  customerAddress: string;

  /*
  customerAddress:
  - Địa chỉ giao hàng.
  - @IsString(): dạng chuỗi, không cho để trống.
*/

  @IsOptional()
  @IsString()
  customerEmail?: string;
  /*
    customerEmail:
    - Email không bắt buộc trong mọi đơn hàng (người không có email vẫn mua được).
    - @IsOptional(): có thể bỏ trống. Nếu không gửi → skip validate.
    - @IsString(): nếu gửi thì phải là chuỗi.
  */


  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ (COD hoặc MOMO)' })
  paymentMethod: PaymentMethod;
  /*
  paymentMethod:
  - Phương thức thanh toán (COD hoặc MOMO).
  - PaymentMethod là Enum do bạn tự định nghĩa, VD:
      export enum PaymentMethod { COD = 'COD', MOMO = 'MOMO' }

  - @IsEnum(): chỉ cho phép giá trị nằm trong enum.
*/

  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  items: OrderItemDto[];
  /*
  items:
  - Danh sách các sản phẩm mua trong đơn hàng.
  - @IsArray(): bắt buộc phải là mảng để tránh client gửi object đơn.
  - @ArrayMinSize(1): đơn hàng phải có ít nhất 1 sản phẩm.
  - @ValidateNested({ each: true }): validate từng phần tử bên trong.
  - @Type(() => OrderItemDto): class-transformer sẽ biến từng object
    trong mảng thành đúng class OrderItemDto.

  nguyên lý hoạt động:
  - Client gửi JSON:
      items: [
        { productId: 5, quantity: 2 },
        { productId: 9, quantity: 1 }
      ]

  - backend sẽ thực thực các bước:
    1) Parse JSON thành DTO
    2) Ép từng phần tử thành OrderItemDto
    3) Validate từng phần tử (productId, quantity, ...)
*/

  @IsNumber()
  @Type(() => Number)
  @Min(1000, { message: 'Tổng tiền phải ít nhất 1,000đ' })
  totalAmount: number;
  /*
    totalAmount:
    - Tổng tiền đơn hàng.
    - @IsNumber(): bắt buộc là số.
    - @Type(() => Number): ép kiểu từ string sang kiểu number.
    - @Min(1000): bắt >= 1000đ (tránh ghi sai, vd: 0, -100, hoặc hack).

    phải kiểm tra totalAmount
    - Client có thể sửa giá.
    - Backend cần validate lần cuối trước khi ghi DB.

  */


}
