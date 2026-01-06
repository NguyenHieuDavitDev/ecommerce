import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  productId: number;
  /*
  productId:
  - ID của sản phẩm trong hệ thống.
  - Khi client gửi request, dữ liệu JSON luôn là dạng string,
    nên cần @Type(() => Number) để ép thành số.

  @Type(() => Number)
    class-transformer tự ép kiểu string sang number trước khi validate.
      VD: "5" → 5

  @IsNumber()
   Kiểm tra productId sau khi transform có phải là số hợp lệ không.
      Ngăn trường hợp client gửi giá trị kiểu khác (null, string chữ, object,...)

  @Min(1)
    Giá trị phải >= 1
    ID sản phẩm luôn bắt đầu từ 1, không có ID = 0 hoặc số âm.
*/

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
/*
    quantity:
    - Số lượng mua của sản phẩm.

    - @Type(() => Number) : ép kiểu (vì client có thể gửi "2")
    - @IsNumber()         : bắt buộc là số hợp lệ
    - @Min(1)             : không cho mua 0 sản phẩm hoặc số âm

    vì:
    - quantity = 0  → không hợp lệ trong đơn hàng
    - quantity < 0 → sai logic hoàn toàn
    - quantity = NaN hoặc string thì backend không xử lý được
  */

}
