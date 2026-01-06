import {
  Controller, Post, Body, Get, Param, Patch, Delete, ParseIntPipe, Logger, Query
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './order.entity';

import axios from 'axios';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import * as stream from 'stream';
import * as path from 'path';
import * as fs from 'fs';

@Controller('orders')
export class OrderController {

  // Khởi tạo một logger riêng cho controller này
  // Logger(OrderController.name) sẽ tự động gắn tên class "OrderController"
  // giúp log hiển thị rõ nguồn log đến từ controller nào
  private readonly logger = new Logger(OrderController.name);

  // Inject OrderService vào controller thông qua Dependency Injection của NestJS
  // - private readonly orderService: OrderService
  //   NestJS tự tạo instance của OrderService và truyền vào controller
  // - Không cần tự khởi tạo new OrderService(), NestJS container tự quản lý vòng đời
  // - Cho phép controller gọi các hàm xử lý logic như orderService.create(), orderService.update(), ...
  constructor(private readonly orderService: OrderService) { }

  // Đánh dấu đây là HTTP POST endpoint
  // Khi client gửi POST /orders (tùy theo route của controller)
  // phương thức create() sẽ được gọi
  @Post()

  // Handler cho request POST tạo đơn hàng
  // @Body() tự động lấy JSON body từ request và ánh xạ vào dto (CreateOrderDto)
  // NestJS sẽ:
  //   - Parse body JSON sang object
  //   - Validate theo DTO (nếu có class-validator)
  //   - Truyền dto vào tham số method
  create(@Body() dto: CreateOrderDto) {

    // Gọi service để xử lý logic tạo đơn hàng
    // Controller chỉ điều phối request, không xử lý logic
    // orderService.create(dto) sẽ:
    //   - Validate dữ liệu
    //   - Tạo order trong DB
    //   - Trả về kết quả đã tạo
    return this.orderService.create(dto);
  }

  // Đánh dấu endpoint HTTP GET
  // Khi client gửi GET /orders (tuỳ thuộc vào @Controller('orders'))
  // phương thức findAll() sẽ được gọi để xử lý request
  @Get()

  // Handler cho request GET để lấy danh sách tất cả đơn hàng
  findAll() {

    // Gọi vào tầng service để xử lý logic lấy dữ liệu
    // Controller KHÔNG trực tiếp truy vấn DB vì nguyên tắc phân tách trách nhiệm
    // orderService.findAll() sẽ:
    //   - Truy vấn database (ví dụ dùng TypeORM repository)
    //   - Lấy danh sách toàn bộ order
    //   - Trả về mảng các order
    return this.orderService.findAll();
  }


  // Định nghĩa endpoint GET có kèm tham số động :id
  // Khi client gọi: GET /orders/10
  // → NestJS sẽ ánh xạ "10" vào biến id bên dưới
  @Get(':id')

  // Handler cho request lấy thông tin một đơn hàng theo ID
  // @Param('id', ParseIntPipe):
  //   - Lấy giá trị 'id' từ URL params
  //   - ParseIntPipe tự động chuyển "id" từ string → number
  //   - Nếu id không phải số hợp lệ → tự động trả lỗi 400 (Bad Request)
  findOne(@Param('id', ParseIntPipe) id: number) {

    // Gọi service để xử lý logic tìm đơn hàng
    // findOne(id) sẽ:
    //   - Truy vấn DB tìm order với primary key = id
    //   - Nếu không tồn tại → có thể throw error (tùy bạn xử lý trong service)
    return this.orderService.findOne(id);
  }


  // Định nghĩa endpoint HTTP PATCH với tham số động :id
  // Khi client gọi PATCH /orders/5
  // → phương thức update() sẽ được kích hoạt và nhận id = 5
  @Patch(':id')

  // Handler cập nhật một phần dữ liệu của đơn hàng
  // @Param('id', ParseIntPipe):
  //   - Lấy giá trị id từ URL
  //   - ParseIntPipe chuyển id từ string → number
  //   - Nếu không phải số hợp lệ → trả lỗi 400
  //
  // @Body() dto:
  //   - Lấy JSON body từ request
  //   - dto là Partial<CreateOrderDto>, nghĩa là:
  //       + Không bắt buộc phải gửi đủ tất cả fields
  //       + Chỉ cần gửi field nào cần cập nhật
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateOrderDto>,
  ) {

    // Gọi service để xử lý logic cập nhật đơn hàng
    // orderService.update(id, dto) sẽ:
    //   - Tìm order theo id
    //   - Merge dữ liệu mới vào
    //   - Lưu lại vào DB
    //   - Trả về kết quả order sau khi cập nhật
    return this.orderService.update(id, dto);
  }


  // Định nghĩa endpoint PATCH có path mở rộng ':id/status'
  // Ví dụ: PATCH /orders/12/status
  // → Phương thức updateStatus() sẽ được gọi, nhận id = 12
  @Patch(':id/status')

  // Handler để cập nhật trạng thái (status) của đơn hàng
  // - @Param('id', ParseIntPipe): lấy id từ URL và ép kiểu từ string → number
  //   + Nếu id không phải số → ParseIntPipe tự động trả lỗi 400 (Bad Request)
  //
  // - @Body() body: nhận trường status từ JSON body gửi lên
  //   + body phải có dạng { "status": "PAID" } hoặc giá trị hợp lệ của enum OrderStatus
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: OrderStatus },
  ) {

    // Gọi service xử lý cập nhật trạng thái đơn hàng
    // - orderService.updateStatus(id, body.status):
    //     + Tìm đơn hàng theo id
    //     + Kiểm tra trạng thái hợp lệ (nếu service có validation)
    //     + Cập nhật status trong database
    //     + Trả về kết quả sau khi cập nhật
    return this.orderService.updateStatus(id, body.status);
  }


  // Định nghĩa endpoint HTTP DELETE với tham số động :id
  // Khi client gọi: DELETE /orders/7
  // → phương thức remove() sẽ được gọi và nhận id = 7
  @Delete(':id')

  // Handler để xóa một đơn hàng dựa trên ID
  // @Param('id', ParseIntPipe):
  //   - Lấy giá trị id từ URL params
  //   - ParseIntPipe chuyển id từ string → number
  //   - Nếu id không phải số hợp lệ → trả lỗi 400 tự động
  remove(@Param('id', ParseIntPipe) id: number) {

    // Gọi tầng service để xử lý logic xóa đơn hàng
    // orderService.remove(id):
    //   - Kiểm tra order có tồn tại không
    //   - Xóa order khỏi database (ví dụ bằng repository.delete())
    //   - Trả về kết quả (thường là thông báo hoặc order đã bị xóa)
    return this.orderService.remove(id);
  }

  // ===================== MoMo PAYMENT =====================
  @Post('momo')
  async momo(@Body() dto: CreateOrderDto) {
    // Tạo order trước với status PENDING
    const orderResult = await this.orderService.create(dto);
    const order = orderResult.order || orderResult;

    return {
      payUrl: orderResult.payUrl || order.momoPaymentUrl,
      orderId: order.id,
      order: order,
    };
  }

  // ===================== MoMo IPN CALLBACK =====================
  @Post('momo/ipn')
  async momoIpn(@Body() data: any) {
    this.logger.log(`[MoMo IPN] Received callback: ${JSON.stringify(data)}`);
    const result = await this.orderService.handleMomoIpn(data);
    return result;
  }

  // ===================== FINALIZE PAYMENT =====================
  @Post('finalize')
  async finalizePaid(@Body() dto: CreateOrderDto & { orderId?: number; momoOrderId?: string }) {

    // `saved` sẽ là object Order cuối cùng sau khi xử lý
    let saved;

    // ==============================
    // 1) XỬ LÝ TRƯỜNG HỢP: CÓ orderId TỪ FRONTEND HOẶC CALLBACK MOMO
    // ==============================
    if (dto.orderId) {
      // Nếu nhận được orderId → cập nhật trạng thái thành PAID
      saved = await this.orderService.updateStatus(dto.orderId, OrderStatus.PAID);

      // ==============================
      // 2) XỬ LÝ TRƯỜNG HỢP: THANH TOÁN QUA MOMO (momoOrderId)
      // ==============================
    } else if (dto.momoOrderId) {
      // Tìm order theo mã MoMo orderId (momoOrderId là chuỗi partnerCode+timestamp)
      saved = await this.orderService.findByMomoOrderId(dto.momoOrderId);


      if (saved) {
        // Nếu tìm thấy → cập nhật trạng thái thành PAID        
        saved = await this.orderService.updateStatus(saved.id, OrderStatus.PAID);
      } else {
        // Nếu không tìm thấy → fallback tạo order mới
        saved = await this.orderService.createPaid(dto);
      }
    } else {
      // ==============================
      // 3) TRƯỜNG HỢP KHÁC: KHÔNG CÓ orderId & momoOrderId → TẠO ORDER MỚI
      // ==============================
      saved = await this.orderService.createPaid(dto);
    }

    // Gửi email hoá đơn (dùng thông tin cấu hình trong OrderService)
    try {
      await this.orderService.sendInvoiceEmail(saved, saved.customerEmail || dto.customerEmail);
    } catch (err: any) {
      this.logger.warn(`[Finalize][mail] failed for order ${saved.id}: ${err.message}`);
    }

    return saved;
  }

  // ===================== PDF =====================
  private async generateInvoicePdfStream(order: any): Promise<stream.Readable> {
    // Tạo tài liệu PDF mới, kích thước A4 và lề cách mép 50px
    // PDFDocument là object dùng để viết nội dung PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Tạo một PassThrough stream để xuất PDF ra luồng dữ liệu
    // không cần lưu file PDF vào ổ cứng → gửi mail nhanh hơn
    const outStream = new stream.PassThrough();

    // Nối (pipe) nội dung PDF vào luồng outStream
    doc.pipe(outStream);

    // -------------------------------------------------------------
    // Tải font hỗ trợ tiếng Việt (UTF-8)
    // Dùng process.cwd() để tương thích cả DEV (ts-node) và PROD (dist/)
    // -------------------------------------------------------------
    const fontPath = path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf');

    // Nếu không tìm thấy file font → báo lỗi để tránh PDF bị lỗi ký tự
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font not found: ${fontPath}`);
    }

    // Đặt font mặc định cho toàn bộ PDF
    doc.font(fontPath);

    // -------------------------------------------------------------
    // 1) TIÊU ĐỀ HÓA ĐƠN
    // -------------------------------------------------------------
    doc.fontSize(18).text('HÓA ĐƠN THANH TOÁN', { align: 'center' }); // căn giữa
    doc.moveDown(); // xuống dòng (khoảng cách lớn hơn text)

    // -------------------------------------------------------------
    // 2) THÔNG TIN CHUNG CỦA ĐƠN HÀNG
    // -------------------------------------------------------------
    doc.fontSize(12); // đặt cỡ chữ nhỏ lại cho phần thông tin chi tiết
    doc.text(`Mã đơn hàng: ${order.id}`);
    doc.text(`Khách hàng: ${order.customerName}`);
    doc.text(`SĐT: ${order.customerPhone}`);
    doc.text(`Địa chỉ: ${order.customerAddress}`);
    doc.moveDown(); // tạo khoảng trống

    // -------------------------------------------------------------
    // 3) DANH SÁCH SẢN PHẨM TRONG ĐƠN
    // -------------------------------------------------------------

    // order.items là danh sách sản phẩm trong đơn
    // Nếu không có items → dùng mảng rỗng để tránh lỗi
    doc.text('Chi tiết sản phẩm:');
    (order.items || []).forEach((it: any, idx: number) => {
      doc.text(
        // idx + 1: số thứ tự
        // it.product?.name: tên sản phẩm (?. để tránh lỗi undefined)
        // SL: số lượng
        // Giá: format theo locale
        `${idx + 1}. ${it.product?.name} - SL: ${it.quantity} - Giá: ${Number(it.price).toLocaleString()} đ`
      );
    });

    // -------------------------------------------------------------
    // 4) TỔNG TIỀN - CĂN PHẢI
    // -------------------------------------------------------------
    doc.moveDown();
    doc.fontSize(14).text(
      `Tổng tiền: ${Number(order.totalAmount).toLocaleString()} đ`,
      { align: 'right' },  // căn phải
    );

    // -------------------------------------------------------------
    // 5) KẾT THÚC TÀI LIỆU PDF
    // -------------------------------------------------------------
    doc.end(); // đóng file PDF → stream bắt đầu emit dữ liệu

    // Trả stream để controller xử lý
    return outStream;
  }
}
