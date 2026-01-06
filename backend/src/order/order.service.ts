

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../product/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentMethod } from './order.constants';
import * as crypto from 'crypto';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name); // Tạo một logger riêng cho service OrderService để ghi log (debug, error, warning…).

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    // Repository cho entity Order
    // - orderRepo dùng để thao tác cho bảng orders

    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    // Repository cho entity OrderItem
    // - itemRepo dùng để thao tác cho bảng order_items

    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    // Repository cho entity Product
    // - productRepo dùng để truy vấn thông tin sản phẩm

    @InjectRepository(PaymentTransaction) private readonly txRepo: Repository<PaymentTransaction>,
    // Repository cho entity PaymentTransaction
    // - txRepo dùng để lưu và quản lý giao dịch thanh toán

    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    // DataSource của TypeORM
    // - Dùng để tạo query runner, transaction
    // - Khi muốn thao tác nhiều bảng trong cùng 1 transaction

  ) { }

  // ===================== CREATE ORDER =====================
  async create(dto: CreateOrderDto): Promise<any> {
    // B1: Kiểm tra có ít nhất 1 item trong đơn hàng
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Nếu chọn thanh toán MoMo nhưng thiếu cấu hình → chặn sớm trước khi tạo order
    if (dto.paymentMethod && dto.paymentMethod === PaymentMethod.MOMO) {
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      if (!accessKey || !secretKey || !partnerCode) {
        this.logger.error('MoMo credentials are missing. Check MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_PARTNER_CODE.');
        throw new BadRequestException('MoMo payment is not configured');
      }
    }

    // Log thông tin order tạo ra (tên khách + phương thức thanh toán)
    this.logger.log(`Creating order for ${dto.customerName}, method=${dto['paymentMethod'] || 'COD'}`);

    /**
   * B2: Transaction
   * - Dùng this.dataSource.transaction để:
   *   + Nếu có lỗi trong quá trình tạo order, rollback tất cả thay đổi
   *   + Bao gồm: giảm stock sản phẩm, lưu order, lưu order items
   */
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const items: OrderItem[] = [];  // Danh sách OrderItem để lưu
      let totalAmount = 0;            // tổng tiền tạm lưu

      // B3: Duyệt qua từng sản phẩm trong đơn
      for (const item of dto.items) {

        // Lấy thông tin product từ DB
        const product = await manager.getRepository(Product).findOne({ where: { id: item.productId } });

        // Nếu sản phẩm không tồn tại thì báo lỗi 404
        if (!product) throw new NotFoundException(`Product ID ${item.productId} not found`);

        // Kiểm tra tồn kho đủ không
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ID ${item.productId}`);
        }

        // Tạo OrderItem (chưa gắn order)
        const orderItem = this.itemRepo.create({
          // product: gán object Product cho OrderItem
          // - OrderItem sẽ biết sản phẩm nào được mua
          // - là quan hệ ManyToOne (OrderItem → Product)
          product,

          price: product.price,
          // price: lưu giá tại thời điểm mua
          // - Không lấy giá trực tiếp từ Product khi tính tổng order sau này
          // - Giữ lịch sử chính xác, vì giá product có thể thay đổi theo thời gian


          quantity: item.quantity,
          // quantity: số lượng sản phẩm khách mua
          // - Lấy từ DTO (lấy từ input client ở phần số lượng sản phẩm ở giỏ hàng)
          // - Sẽ validate trước (>=1, <= stock)
        });

        // Cộng tổng tiền
        totalAmount += Number(product.price) * item.quantity;
        // Cộng dồn tổng tiền của đơn hàng
        // - product.price có thể là kiểu decimal (string/number từ DB)
        // - Number(...) ép kiểu sang number để tránh lỗi tính toán
        // - item.quantity là số lượng khách đặt
        // totalAmount = tổng tiền từng sản phẩm * số lượng
        items.push(orderItem);
        // Thêm OrderItem vào mảng items tạm thời
        // - Chưa save vào DB, nhưng giữ danh sách các item để gắn order sau
        // - Sau khi gắn order (it.order = savedOrder), sẽ save tất cả items cùng transaction


        // Giảm stock sản phẩm ngay trong transaction
        product.stock -= item.quantity;
        // Giảm số lượng tồn kho của sản phẩm
        // - item.quantity là số lượng khách đặt
        // - product.stock -= item.quantity: trừ đi số lượng vừa mua
        // - Giữ stock luôn chính xác, tránh oversell
        await manager.getRepository(Product).save(product);
        // Lưu lại product đã cập nhật stock trong cùng transaction
        // - Dùng manager.getRepository(Product).save(product) để save trong transaction hiện tại
        // - Nếu có lỗi trong quá trình tạo order, toàn bộ transaction rollback trả kết quả stock không bị sai
      }

      // B4: Tạo order
      let savedOrder = await manager.getRepository(Order).save(
        // Bước 4.1: Lưu Order vào database trong transaction hiện tại
        // manager.getRepository(Order).save(...)
        // - manager.getRepository(Order) truy xuất repository của entity Order trong transaction
        // - save(...) ghi entity vào database
        // - Nếu entity chưa có id thì TypeORM sẽ tự generate id (PrimaryGeneratedColumn)
        // - Nếu entity đã có id thì TypeORM sẽ update record tương ứng
        // - Vì manager trong transaction:
        //     + Tất cả thao tác liên quan sẽ rollback nếu có lỗi xảy ra sau
        //     + để atomicity: tất cả hoặc không gì cả
        manager.getRepository(Order).create({
          // Bước 4.2: Tạo một instance mới của Order
          // Tạo một instance mới của Order trong bộ nhớ
          // manager.getRepository(Order).create({...})
          // - Chỉ tạo object Order trong memory, chưa lưu vào database
          // - Có thể chỉnh sửa hoặc gán relation trước khi save
          // - Dữ liệu được gán từ DTO và các giá trị mặc định

          customerName: dto.customerName,  // Tên khách hàng, lấy từ DTO (input client)
          customerPhone: dto.customerPhone, // Số điện thoại liên hệ, lấy từ DTO
          customerAddress: dto.customerAddress, //  Địa chỉ giao hàng, lấy từ DTO
          customerEmail: dto.customerEmail, // Email khách hàng, optional
          paymentMethod: dto.paymentMethod || PaymentMethod.COD, // Phương thức thanh toán
          // Nếu client không truyền → mặc định COD

          totalAmount: Number(totalAmount.toFixed(2)),
          // Tổng tiền đơn hàng
          // - totalAmount đã tính trước (sum(product.price * quantity))
          // - toFixed(2) là chuẩn 2 chữ số thập phân
          // - Number(...) là ép kiểu sang number (decimal từ DB có thể là string)
          status:
            dto.paymentMethod && dto.paymentMethod === PaymentMethod.COD
              ? OrderStatus.PAID
              : OrderStatus.PENDING,
          // Trạng thái order
          // - COD là thanh toán ngay thì status = PAID
          // - MOMO là chờ thanh toán thì status = PENDING
        }),
      );
      // B 4.3: Gắn order vào từng OrderItem và lưu
      for (const it of items) {
        it.order = savedOrder;
      }
      await manager.getRepository(OrderItem).save(items);

      // B6: Lấy lại order đầy đủ với relations (items + product)
      savedOrder = (await manager.getRepository(Order).findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],
      })) as Order;

      return savedOrder;
    });

    // B 4.4: Xử lý email / payment theo phương thức

    // COD thì gửi hóa đơn ngay
    if (dto['paymentMethod'] && dto['paymentMethod'] === 'COD') {
      await this.sendInvoiceEmail(savedOrder, dto.customerEmail);
      return { message: 'Order created successfully (COD)', order: savedOrder };
    }

    // Nếu là MOMO thì tạo link thanh toán
    if (dto.paymentMethod && dto.paymentMethod === PaymentMethod.MOMO) {
      const payUrl = await this.createMomoPayment(savedOrder);
      // Lưu payment URL vào order
      savedOrder.momoPaymentUrl = payUrl;
      await this.orderRepo.save(savedOrder);
      return { message: 'Order pending payment (MoMo)', payUrl, order: savedOrder };
    }

    // Nếu không truyền paymentMethod thì mặc định COD
    await this.sendInvoiceEmail(savedOrder, dto.customerEmail);
    return { message: 'Order created successfully (default COD)', order: savedOrder };
  }

  // ===================== GỬI EMAIL HÓA ĐƠN =====================
  async sendInvoiceEmail(order: Order, email?: string) {
    // Bước 1: Tạo transporter để gửi email
    // - Dùng nodemailer
    // - service: gmail
    // - auth: email và mật khẩu (hoặc app password nếu Gmail bảo mật 2 bước)
    try {
      const mailService = this.configService.get<string>('MAIL_SERVICE', 'gmail');
      const mailUser = this.configService.get<string>('MAIL_USER');
      const mailPass = this.configService.get<string>('MAIL_PASS');
      const mailFromName = this.configService.get<string>('MAIL_FROM_NAME', 'Shop Support');

      if (!mailUser || !mailPass) {
        throw new Error('Mail credentials are not configured');
      }

      const transporter = nodemailer.createTransport({
        service: mailService,
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      });


      // Bước 2: Tạo PDF hóa đơn
      // - Dùng PDFKit
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      // Lắng nghe sự kiện 'data', push từng chunk buffer vào mảng
      doc.on('data', buffers.push.bind(buffers));

      // Sự kiện 'end' → PDF đã được render xong
      doc.on('end', async () => {

        // Gộp các buffer thành 1 PDF hoàn chỉnh
        const pdfBuffer = Buffer.concat(buffers);

        // Bước 3: Gửi email kèm PDF
        await transporter.sendMail({
          from: `${mailFromName} <${mailUser}>`,  // người gửi
          to: email || mailUser,   // người nhận, nếu không truyền → gửi về email mặc định
          subject: `Hóa đơn đơn hàng #${order.id}`,  // tiêu đề email
          html: `<p>Xin chào ${order.customerName},</p>
                 <p>Cảm ơn bạn đã đặt hàng tại <strong>MyShop</strong>.</p>
                 <p>Tổng tiền: <strong>${Number(order.totalAmount).toLocaleString()}đ</strong></p>
                 <p>Trạng thái: ${order.status}</p>`,
          attachments: [
            { filename: `invoice-${order.id}.pdf`, content: pdfBuffer }, // đính kèm PDF hóa đơn
          ],
        });
      });

      // Bước 4: Load font tiếng Việt
      const fontPath = path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf');
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font not found: ${fontPath}`);
      }
      doc.font(fontPath); // set font cho PDF

      // Bước 5: Viết nội dung hóa đơn
      doc.fontSize(18).text('HÓA ĐƠN THANH TOÁN', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Khách hàng: ${order.customerName}`);
      doc.text(`SĐT: ${order.customerPhone}`);
      doc.text(`Địa chỉ: ${order.customerAddress}`);
      doc.moveDown();

      // Bước 6: Liệt kê từng sản phẩm trong đơn
      (order.items || []).forEach((it, i) => {
        doc.text(`${i + 1}. ${it.product?.name} - SL: ${it.quantity} - Giá: ${Number(it.price).toLocaleString()}đ`);
      });
      // Bước 7: Tổng cộng
      doc.moveDown();
      doc.fontSize(14).text(`Tổng cộng: ${Number(order.totalAmount).toLocaleString()}đ`, { align: 'right' });

      // Bước 8: Kết thúc PDF → trigger event 'end' để gửi email
      doc.end();
    } catch (err) {
      // Bắt lỗi và log
      this.logger.error('Gửi email hóa đơn thất bại:', err.message);
    }
  }

  // ===================== RECORD PAYMENT TX =====================
  async recordPaymentTransaction(
    partial: Partial<PaymentTransaction>,   // Nhận vào một object chứa một phần thông tin giao dịch (không cần đủ hết)
  ): Promise<PaymentTransaction> {

    // Tạo một instance của entity PaymentTransaction từ object truyền vào.
    // - Không lưu vào DB ngay lập tức
    // - Chỉ "đóng gói" dữ liệu theo đúng cấu trúc của Entity
    // - create() giúp tự động mapping field → không cần khởi tạo thủ công
    const tx = this.txRepo.create(partial);

    // Lưu dữ liệu transaction vào database.
    // - Nếu entity chưa có id → TypeORM sẽ INSERT mới
    // - Nếu có id → TypeORM sẽ UPDATE
    // - save() trả về bản ghi sau khi đã lưu (có đầy đủ id, createdAt,...)
    return this.txRepo.save(tx);
  }


  // ===================== CREATE PAID ORDER =====================
  async createPaid(dto: CreateOrderDto): Promise<Order> {
    // Kiểm tra xem DTO có danh sách sản phẩm hay không.
    // Một đơn hàng bắt buộc phải có ít nhất một sản phẩm → đây là kiểm tra tính hợp lệ đầu vào
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    /**
   * ====================== NGUYÊN LÝ TRANSACTION ======================
   * - Một transaction đảm bảo toàn bộ các thao tác xảy ra “tất cả hoặc không”.
   * - Nếu bất kỳ bước nào lỗi (hết hàng, không tìm thấy sản phẩm, lỗi DB,...)
   *  toàn bộ dữ liệu sẽ rollback về trạng thái ban đầu.
   * - TypeORM cung cấp `dataSource.transaction` để đảm bảo tính toàn vẹn dữ liệu (ACID properties).
   * 
   * ACID gồm:
   *  A – Atomicity (tính nguyên tử): tất cả bước đều hoàn thành hoặc không có gì thay đổi.
   *  C – Consistency (tính nhất quán): dữ liệu trước/sau đều hợp lệ theo business rule.
   *  I – Isolation (tính biệt lập): transaction không ảnh hưởng qua lại.
   *  D – Durability (tính bền vững): dữ liệu sau commit được ghi chắc chắn vào DB.
   * 
   * Đây là lý do phần xử lý order + trừ kho phải chạy trong transaction.
   */
    return await this.dataSource.transaction(async (manager) => {
      const items: OrderItem[] = []; // Mảng tạm chứa danh sách OrderItem sẽ được lưu sau.
      let totalAmount = 0;  // Biến tính tổng tiền đơn hàng.

      /**
       * ====================== DUYỆT TỪNG SẢN PHẨM ======================
       * - Mỗi item gồm: productId và quantity.
       * - Phần này thực hiện:
       *     1. Kiểm tra sản phẩm có tồn tại không
       *     2. Kiểm tra đủ tồn kho hay không
       *     3. Tạo đối tượng OrderItem nhưng CHƯA LƯU vào DB
       *     4. Giảm tồn kho ngay trong transaction
       */
      for (const item of dto.items) {
        // Lấy repo Product thông qua manager trong transaction
        // manager đảm bảo thao tác thuộc transaction hiện tại
        const product = await manager.getRepository(Product).findOne({ where: { id: item.productId } });

        // Nếu không tìm thấy sản phẩm thì ném lỗi
        if (!product) throw new NotFoundException(`Product ID ${item.productId} not found`);

        // Kiểm tra tồn kho (business rule)
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ID ${item.productId}`);
        }
        /**
               * ========== TẠO OrderItem ==========
               * create() chỉ tạo instance trên bộ nhớ, chưa lưu DB.
               * OrderItem lưu lại:
               * - product: tham chiếu đến bảng product
               * - price: giá tại THỜI ĐIỂM MUA (giữ lịch sử giá)
               * - quantity: số lượng mua
               */
        const orderItem = this.itemRepo.create({
          product,
          price: product.price,
          quantity: item.quantity,
        });

        // Cộng dồn tổng tiền (price * quantity)
        totalAmount += Number(product.price) * item.quantity;

        // Lưu vào danh sách tạm
        items.push(orderItem);

        /**
      * ========== GIẢM TỒN KHO ==========
      * Nguyên tắc:
      * - Khi khách đặt hàng thanh toán trước (paid) thì trừ kho ngay.
      * - Nếu lỗi ở bước sau, transaction rollback → stock tự quay về trạng thái cũ.
      */
        product.stock -= item.quantity;

        // Ghi thay đổi tồn kho vào DB trong transaction
        await manager.getRepository(Product).save(product);
      }

      /**
 * ====================== TẠO ORDER ======================
 * - create() tạo instance Order.
 * - save() lưu instance vào DB.
 * 
 * - Order được lưu trước, vì OrderItem cần orderId để gắn quan hệ.
 * - status = PAID vì đây là đơn đã thanh toán (không cần Momo).
 */
      let savedOrder = await manager.getRepository(Order).save(
        manager.getRepository(Order).create({
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerAddress: dto.customerAddress,
          totalAmount: Number(totalAmount.toFixed(2)), // Làm tròn 2 chữ số thập phân
          status: OrderStatus.PAID, // Đánh dấu đã thanh toán
        }),
      );

      /**
 * ====================== GẮN ORDER CHO CÁC ORDER ITEM ======================
 * - Một OrderItem cần biết nó thuộc Order nào.
 * - Gán order (object) vào thuộc tính it.order.
 */
      for (const it of items) it.order = savedOrder;

      // Lưu toàn bộ OrderItem vào DB
      await manager.getRepository(OrderItem).save(items);

      /**
       * ====================== LOAD LẠI ORDER======================
       * - savedOrder vừa rồi CHƯA BAO GỒM items và product
       * - Phải fetch lại từ DB với relations
       */
      savedOrder = (await manager.getRepository(Order).findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],  // load danh sách item và sản phẩm tương ứng
      })) as Order;

      // Trả về kết quả cuối cùng đã đầy đủ dữ liệu
      return savedOrder;
    });
  }

  // ===================== MoMo PAYMENT =====================
  private async createMomoPayment(order: Order): Promise<string> {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
    const storeId = this.configService.get<string>('MOMO_STORE_ID', 'MomoTestStore');
    const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL', 'http://localhost:5173/checkout/finalize');
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL', 'http://localhost:3001/orders/momo/ipn');
    const requestType = this.configService.get<string>('MOMO_REQUEST_TYPE', 'payWithMethod');

    if (!accessKey || !secretKey || !partnerCode) {
      this.logger.error('MoMo credentials are missing. Check MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_PARTNER_CODE.');
      throw new BadRequestException('MoMo payment is not configured');
    }

    // --- TẠO ID ĐƠN HÀNG RIÊNG CHO MO MO (PHẢI UNIQUE) ---
    const momoOrderId = partnerCode + new Date().getTime();
    // momoOrderId: id duy nhất gửi lên MoMo cho giao dịch hiện tại.
    // Dùng timestamp đảm bảo uniqueness (partnerCode + timestamp).
    // Lưu ý: nếu gọi create nhiều lần trong cùng ms có thể trùng → có thể bổ sung random.


    // requestId: id cho request, MoMo yêu cầu requestId unique. Ở đây dùng chung momoOrderId cho đơn giản.
    const requestId = momoOrderId;

    // --- THÔNG TIN HIỂN THỊ CHO NGƯỜI DÙNG TRÊN MOMO ---
    const orderInfo = `Thanh toán đơn hàng #${order.id}`;

    // orderInfo: mô tả giao dịch, hiện thị cho user trên trang MoMo.
    const amount = order.totalAmount.toString();
    // amount: số tiền thanh toán, MoMo yêu cầu string. 
    // IMPORTANT: phải là số nguyên (đơn vị tùy theo MoMo config; ở VN thường là đồng VNĐ).
    // Nếu order.totalAmount có phần thập phân, cần đảm bảo format đúng (không gửi dấu ',').



    // Lưu orderId vào extraData để IPN có thể tìm lại order
    const extraData = Buffer.from(JSON.stringify({ orderId: order.id })).toString('base64');

    // --- TẠO CHUỐI DÙNG ĐỂ KÝ (rawSignature) THEO THỨ TỰ BÊN MOMO QUY ĐỊNH ---
    // Thứ tự và tên param rất quan trọng MoMo sẽ dùng cùng thứ tự để verify chữ ký.
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    // --- TẠO CHỮ KÝ HMAC SHA256 TỪ rawSignature VỚI secretKey ---
    // Chữ ký này cho MoMo biết request thực sự từ merchant có secret đúng.


    // --- BUILD REQUEST BODY THEO ĐỊNH DẠNG API MOMO ---
    const requestBody = {
      partnerCode, // mã partner
      partnerName: 'Test', // tên hiển thị (không quan trọng)
      storeId, // id store (optional)
      requestId, // request id đã tạo
      amount,  // số tiền (string)
      orderId: momoOrderId, // momoOrderId (unique)
      orderInfo,    // mô tả
      redirectUrl, // url redirect FE
      ipnUrl,    // url IPN backend
      lang: 'vi',     // ngôn ngữ hiển thị
      requestType, // loại request
      autoCapture: true, // tự capture thanh toán nếu true
      extraData,  // dữ liệu thêm (base64)
      orderGroupId: '',  // optional theo MoMo
      signature, // chữ ký để MoMo verify request
    };

    // --- GỌI API MOMO (HTTP POST) ---
    // Gọi endpoint test của MoMo; response chứa payUrl để redirect user.
    const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, { timeout: 10000 });


    // --- LƯU GIAO DỊCH TẠM (dùng để đối soát khi IPN về) ---
    // Lưu ngay transaction record (có thể là status = PENDING), để sau khi IPN về ta lookup theo momoOrderId.
    // Lưu transaction tạm thời
    await this.txRepo.save({  // nguồn thanh toán
      provider: 'MoMo',  // mã giao dịch bên MoMo
      momoOrderId, // id request
      requestId, // lưu dạng number cho dễ so sánh
      amount: Number(amount), // liên kết với order nội bộ
      orderRefId: order.id, // extraData để tái dựng context
      extraData,
    });

    // --- TRẢ LẠI payUrl ĐỂ FRONTEND REDIRECT NGƯỜI DÙNG ---
    // response.data.payUrl là link của MoMo để user thanh toán.
    return response.data.payUrl;
  }

  // ===================== FIND ORDERS =====================
  async findAll() {
    // Gọi repository để lấy toàn bộ bản ghi Order trong database.
    // orderRepo là Repository<Order> do TypeORM cung cấp.
    return this.orderRepo.find({
      // relations: yêu cầu TypeORM tự động JOIN và load thêm bảng liên quan.
      // Ở đây có 2 quan hệ:
      // 1) 'items'  danh sách OrderItem thuộc mỗi Order
      // 2) 'items.product' từ OrderItem JOIN sang Product để lấy thông tin sản phẩm
      // 
      //  "eager loading theo yêu cầu" (explicit relations), không phải eager mặc định trong entity.
      // TypeORM sẽ tạo query JOIN nhiều bảng, ví dụ:
      // SELECT ... FROM order
      // LEFT JOIN order_item ...
      // LEFT JOIN product ...
      // 
      // khi trả về Order thì sẽ có đầy đủ cả items và product trong mỗi item.
      relations: ['items', 'items.product'],
    });
  }


  async findOne(id: number) {
    // Gọi tới repository của Order để tìm 1 đơn hàng theo id.
    // findOne() trả về 1 Order hoặc null nếu không tìm thấy.
    const order = await this.orderRepo.findOne({
      // where: điều kiện truy vấn → tìm order có trường id = id truyền vào.
      where: { id },
      // relations: yêu cầu TypeORM tự JOIN và load thêm các bảng liên quan.
      // 'items' → load danh sách OrderItem thuộc đơn
      // 'items.product' → mỗi item lại JOIN sang bảng Product để lấy thông tin sản phẩm.
      relations: ['items', 'items.product'],
    });
  
    // Nếu không tìm thấy đơn hàng → ném lỗi 404.
    if (!order) throw new NotFoundException('Order not found');
  
    // Nếu tìm thấy → trả về object Order đầy đủ dữ liệu và các quan hệ.
    return order;
  }
  
  // ===================== UPDATE ORDER =====================
  async update(id: number, dto: Partial<CreateOrderDto>): Promise<Order> {
    // Tìm đơn hàng theo id, đồng thời load luôn các item và thông tin sản phẩm
    const order = await this.orderRepo.findOne({
        where: { id },
        relations: ['items', 'items.product'],
    });

    // Nếu không có đơn hàng → báo lỗi 404
    if (!order) throw new NotFoundException('Order not found');

    // Thực hiện toàn bộ quá trình cập nhật trong 1 transaction để đảm bảo tính toàn vẹn dữ liệu
    return await this.dataSource.transaction(async (manager) => {

      // --- BƯỚC 1: HOÀN TRẢ STOCK CHO TẤT CẢ SẢN PHẨM TRONG ĐƠN HÀNG CŨ ---
      for (const item of order.items) {
        // Lấy lại sản phẩm theo id
        const product = await manager.getRepository(Product).findOne({
          where: { id: item.product.id },
        });

        if (product) {
          // Trả lại số lượng (stock) mà đơn hàng cũ đã trừ trước đó
          product.stock += item.quantity;

          // Lưu cập nhật
          await manager.getRepository(Product).save(product);
        }
      }

      // --- BƯỚC 2: XÓA TOÀN BỘ ORDER ITEM CŨ (RESET LẠI ĐƠN) ---
      await manager.getRepository(OrderItem).delete({ order: { id } });

      // Chuẩn bị danh sách item mới
      const newItems: OrderItem[] = [];
      let totalAmount = 0;

      // --- BƯỚC 3: THÊM DANH SÁCH SẢN PHẨM MỚI TỪ DTO ---
      if (dto.items && dto.items.length > 0) {

        // Lặp qua từng item client gửi lên
        for (const item of dto.items) {

          // Lấy thông tin sản phẩm từ DB
          const product = await manager.getRepository(Product).findOne({
            where: { id: item.productId },
          });

          // Không tìm thấy sản phẩm → lỗi
          if (!product)
            throw new NotFoundException(`Product ID ${item.productId} not found`);

          // Kiểm tra tồn kho
          if (product.stock < item.quantity)
            throw new BadRequestException(
              `Insufficient stock for product ID ${item.productId}`,
            );

          // Tạo mới bản ghi OrderItem (KHÔNG LƯU vội)
          const orderItem = this.itemRepo.create({
            product,         // liên kết sản phẩm
            price: product.price,  // giá tại thời điểm update
            quantity: item.quantity,
            order,           // gán vào đơn hàng hiện tại
          });

          // Tính tổng tiền (tạm tính)
          totalAmount += Number(product.price) * item.quantity;

          // Thêm vào mảng item mới
          newItems.push(orderItem);

          // Trừ stock của sản phẩm (vì đang update item mới)
          product.stock -= item.quantity;

          // Lưu stock mới của sản phẩm
          await manager.getRepository(Product).save(product);
        }
      }

      // --- BƯỚC 4: CẬP NHẬT THÔNG TIN ĐƠN HÀNG ---
      
      // Cập nhật từng trường. Nếu DTO không truyền → giữ giá trị cũ.
      order.customerName = dto.customerName ?? order.customerName;
      order.customerPhone = dto.customerPhone ?? order.customerPhone;
      order.customerAddress = dto.customerAddress ?? order.customerAddress;

      // Nếu có item mới → cập nhật danh sách item.  
      // Nếu không có → giữ nguyên item cũ.
      order.items = newItems.length > 0 ? newItems : order.items;

      // Cập nhật tổng tiền nếu có item mới,
      // còn không thì giữ nguyên tổng tiền cũ.
      order.totalAmount =
        newItems.length > 0
          ? Number(totalAmount.toFixed(2))
          : order.totalAmount;

      // --- BƯỚC 5: LƯU LẠI ĐƠN HÀNG SAU KHI CẬP NHẬT ---
      return manager.getRepository(Order).save(order);
    });
}

  // ===================== DELETE ORDER =====================
  async remove(id: number): Promise<Order> {
    // Tìm Order theo ID, đồng thời load quan hệ items và items.product để có đủ dữ liệu xử lý
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items', 'items.product'] });

    // Nếu không tìm thấy order -> ném lỗi 404
    if (!order) throw new NotFoundException('Order not found');

    // Mở một transaction để đảm bảo tính toàn vẹn dữ liệu:
    //  - Hoàn trả tồn kho
    //  - Xóa các OrderItem
    //  - Xóa Order
    // Nếu một trong các bước fail → rollback toàn bộ
    return await this.dataSource.transaction(async (manager) => {

      // Duyệt từng item trong order để trả lại kho
      for (const item of order.items) {
        // Tìm product tương ứng với item
        const product = await manager.getRepository(Product).findOne({ where: { id: item.product.id } });

        // Nếu product tồn tại thì cộng lại số lượng đã bán (ví dụ khi hủy đơn)
        if (product) {
          product.stock += item.quantity;               // Trả lại số lượng vào kho
          await manager.getRepository(Product).save(product);  // Lưu lại vào DB
        }
      }

      // Xóa toàn bộ OrderItem thuộc order hiện tại
      // Điều kiện { order: { id } } nghĩa là TypeORM sẽ tìm order_id = id trong bảng order_item
      await manager.getRepository(OrderItem).delete({ order: { id } });

      // Xóa luôn record Order trong bảng orders
      await manager.getRepository(Order).delete(id);

      // Trả về order cũ (đã bị xóa ở trên nhưng vẫn trả về để hiển thị thông tin xóa)
      return order;
    });
}

  // ===================== UPDATE ORDER STATUS =====================
  async updateStatus(id: number, status: OrderStatus): Promise<Order> {

    // Tìm Order theo ID, đồng thời load quan hệ items và items.product để có đủ dữ liệu phục vụ việc gửi email và kiểm tra logic.
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items', 'items.product'] });

    // Nếu không tìm thấy order trong DB → ném lỗi NotFound (HTTP 404)
    if (!order) throw new NotFoundException('Order not found');

    // Cập nhật trạng thái mới cho đơn hàng
    order.status = status;

    // Lưu thay đổi trạng thái vào database và nhận lại bản ghi đã cập nhật
    const updated = await this.orderRepo.save(order);

    // Kiểm tra nếu trạng thái mới là PAID (đã thanh toán) 
    // và khách hàng có email → tiến hành gửi email hóa đơn
    if (status === OrderStatus.PAID && order.customerEmail) {
      // Gửi email hóa đơn kèm thông tin chi tiết đơn hàng đã cập nhật
      await this.sendInvoiceEmail(updated, order.customerEmail);
    }

    // Trả về bản ghi đã cập nhật (order đã lưu trong DB)
    return updated;
}


  // ===================== FIND ORDER BY MOMO ORDER ID =====================
  async findByMomoOrderId(momoOrderId: string): Promise<Order | null> {
    // Tìm trong bảng PaymentTransaction (txRepo) một bản ghi có trường momoOrderId giống giá trị truyền vào.
    // - momoOrderId: mã giao dịch do MoMo trả về / tạo khi gọi API tạo payment.
    // - txRepo là Repository<PaymentTransaction>.
    // - findOne(...) trả về 1 bản ghi PaymentTransaction hoặc null nếu không tìm thấy.
    const tx = await this.txRepo.findOne({ where: { momoOrderId } });
  
    // Nếu không tìm thấy transaction hoặc transaction không có orderRefId (không liên kết tới order nội bộ),
    // thì không thể biết đơn hàng tương ứng => trả về null.
    // Trả null có nghĩa: "không tìm thấy order tương ứng với momoOrderId này".
    if (!tx || !tx.orderRefId) return null;
  
    // Nếu tìm được transaction và có orderRefId (ID của Order trong hệ thống),
    // thì truy vấn bảng orders để lấy Order tương ứng theo id = tx.orderRefId.
    // relations: ['items', 'items.product'] đảm bảo load luôn:
    //  - danh sách OrderItem trong order (items)
    //  - và thông tin Product cho mỗi item (items.product)
    // Kết quả trả về là Promise<Order | null> (Order nếu tìm thấy, null nếu không)
    return this.orderRepo.findOne({
      where: { id: tx.orderRefId },
      relations: ['items', 'items.product'],
    });
  }
  

  // ===================== HANDLE MOMO IPN CALLBACK =====================
  async handleMomoIpn(data: any): Promise<{ success: boolean; message: string }> {
    try {
      // Destructure dữ liệu IPN MoMo gửi sang
      // Các field này MoMo trả về trong payload để xác định giao dịch
      const {
        partnerCode,      // Mã đối tác do MoMo cấp cho merchant
        orderId: momoOrderId, // Mã order MoMo sinh khi tạo giao dịch
        requestId,        // requestId lúc tạo thanh toán
        amount,           // Số tiền thanh toán
        orderInfo,        // Thông tin order (mô tả)
        orderType,        // Loại thanh toán
        transId,          // Mã giao dịch MoMo
        resultCode,       // Mã kết quả (0 = thành công)
        message: momoMessage, // Message MoMo trả về
        payType,          // Hình thức thanh toán (webApp, app, atm...)
        responseTime,     // Timestamp phản hồi
        extraData,        // Dữ liệu bổ sung do merchant gửi
        signature,        // Chữ ký HMAC SHA256 MoMo gửi để xác thực
      } = data;

      // ================================
      // 1. VERIFY SIGNATURE - Xác thực chữ ký từ MoMo
      // ================================

      // Khóa bí mật và access key MoMo cấp (đọc từ biến môi trường)
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      if (!secretKey || !accessKey) {
        this.logger.error('[MoMo IPN] Missing MoMo credentials. Set MOMO_ACCESS_KEY and MOMO_SECRET_KEY.');
        return { success: false, message: 'MoMo credentials not configured' };
      }

      // Tạo rawSignature theo đúng thứ tự MoMo yêu cầu
      // Nếu thứ tự sai → signature sẽ không đúng → bị giả mạo
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&orderId=${momoOrderId}&orderInfo=${orderInfo}&orderType=${orderType || 'momo_wallet'}&partnerCode=${partnerCode}&payType=${payType || 'webApp'}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      // Tạo chữ ký local để so sánh
      const expectedSignature = crypto
        .createHmac('sha256', secretKey) // dùng thuật toán HMAC SHA256
        .update(rawSignature)            // truyền rawSignature vào
        .digest('hex');                  // encode dạng hex

      // Nếu signature MoMo gửi ≠ signature hệ thống tạo
      // => IPN bị can thiệp hoặc giả mạo
      if (signature !== expectedSignature) {
        this.logger.warn(`[MoMo IPN] Invalid signature for orderId: ${momoOrderId}`);
        return { success: false, message: 'Invalid signature' };
      }

      // ================================
      // 2. Parse extraData (decode Base64) để lấy orderId hệ thống
      // extraData là nơi merchant nhét thông tin riêng (ví dụ: orderId local)
      // ================================

      let orderRefId: number | null = null;
      try {
        if (extraData) {
          // extraData do merchant encode base64 khi tạo MoMo payment
          const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString());
          orderRefId = decoded.orderId || null; // lấy orderId của hệ thống
        }
      } catch (e) {
        this.logger.warn(`[MoMo IPN] Failed to parse extraData: ${e.message}`);
      }

      // ================================
      // 3. LƯU TRANSACTION VÀO DATABASE
      // Lưu toàn bộ log giao dịch để phục vụ tra soát
      // ================================

      const tx = await this.txRepo.save({
        provider: 'MoMo',          // tên nhà cung cấp
        momoOrderId,               // mã order phía MoMo
        requestId,                 // id request gốc
        transId,                   // mã giao dịch từ MoMo
        amount: Number(amount),    // lưu amount dạng số
        payType,                   // phương thức thanh toán
        resultCode: Number(resultCode), // resultCode dạng number
        message: momoMessage,      // message từ MoMo
        extraData,                 // data base64
        signature,                 // chữ ký MoMo
        orderRefId: orderRefId || undefined, // order hệ thống
      });

      // ================================
      // 4. Nếu Giao dịch thành công → Cập nhật đơn hàng
      // ================================

      if (resultCode === 0 && orderRefId) {
        // Tìm order theo orderRefId
        const order = await this.orderRepo.findOne({ where: { id: orderRefId } });

        // Nếu order còn trạng thái chờ thanh toán
        if (order && order.status === OrderStatus.PENDING) {

          // Cập nhật sang trạng thái đã thanh toán
          order.status = OrderStatus.PAID;
          await this.orderRepo.save(order);

          // Gửi email hoá đơn cho khách nếu có email
          if (order.customerEmail) {
            await this.sendInvoiceEmail(order, order.customerEmail);
          }

          this.logger.log(`[MoMo IPN] Order ${orderRefId} updated to PAID`);

          return {
            success: true,
            message: `Order ${orderRefId} payment confirmed`,
          };
        }
      }

      // Nếu không phải giao dịch thành công hoặc order không hợp lệ
      return { success: true, message: 'IPN processed' };

    } catch (error: any) {
      // Bắt lỗi chung cho IPN
      this.logger.error(`[MoMo IPN] Error: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
}

}
