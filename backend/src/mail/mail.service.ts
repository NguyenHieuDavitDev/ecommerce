// ------------------------ IMPORTS ------------------------

// Injectable: decorator của NestJS, biến class thành provider có thể inject vào các module khác
// Logger: lớp logging tích hợp sẵn của NestJS để ghi log info, warn, error
import { Injectable, Logger } from '@nestjs/common';

// ConfigService: service của NestJS dùng để đọc biến môi trường hoặc cấu hình runtime
import { ConfigService } from '@nestjs/config';

// Import toàn bộ thư viện nodemailer
// Nodemailer là thư viện Node.js dùng để gửi email qua SMTP server hoặc các dịch vụ email
import * as nodemailer from 'nodemailer';

// ------------------------ SERVICE CLASS ------------------------

@Injectable() // Đánh dấu MailService là provider có thể inject
export class MailService {

  // Khởi tạo logger riêng cho service này, MailService.name giúp log biết nguồn
  private readonly logger = new Logger(MailService.name);
  // readonly: giá trị không thể thay đổi sau khi khởi tạo

  // transporter là đối tượng nodemailer dùng để gửi email
  // ? nghĩa là có thể undefined nếu cấu hình mail không đầy đủ
  private readonly transporter?: nodemailer.Transporter;

  // from: địa chỉ email người gửi, định dạng "Tên hiển thị <email>"
  private readonly from?: string;

  // ------------------------ CONSTRUCTOR ------------------------
  // Constructor được NestJS gọi khi service được tạo
  // configService được inject tự động nhờ DI (Dependency Injection)
  constructor(private readonly configService: ConfigService) {

    // Lấy email người gửi từ biến môi trường MAIL_USER
    // Nếu không có, fallback sang default 'hieu102056@donga.edu.vn'
    const user = this.configService.get<string>('MAIL_USER');

    // Lấy mật khẩu từ biến môi trường MAIL_PASS
    // .replace(/\s+/g, '') loại bỏ tất cả khoảng trắng, phòng trường hợp paste sai format
    const pass = this.configService.get<string>('MAIL_PASS')?.replace(/\s+/g, '');

    // Lấy tên dịch vụ email (gmail, yahoo, outlook…) từ biến môi trường
    const service = this.configService.get<string>('MAIL_SERVICE', 'gmail');

    // Lấy tên hiển thị người gửi
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Shop Support');

    // Nếu user và pass hợp lệ thì tạo transporter
    if (user && pass) {
      // Gán biến from: định dạng "Tên hiển thị <email>"
      this.from = `${fromName} <${user}>`;

      // Khởi tạo transporter của nodemailer
      // service: xác định nhà cung cấp email (gmail, outlook...)
      // auth: thông tin đăng nhập SMTP
      this.transporter = nodemailer.createTransport({
        service,
        auth: { user, pass },
      });

      // Cơ chế:
      // Nodemailer sẽ dùng transporter này để connect SMTP server,
      // authenticate và gửi email mỗi khi sendMail() được gọi
    } else {
      // Nếu thiếu user hoặc pass, ghi log cảnh báo
      this.logger.warn('MAIL_USER or MAIL_PASS not configured. Email sending disabled.');
      // Không tạo transporter => service vẫn chạy nhưng không thể gửi email
    }
  }

  // ------------------------ METHOD: SEND VERIFICATION CODE ------------------------
  // Gửi mã xác nhận cho người dùng
  async sendVerificationCode(
    to: string, // email người nhận
    code: string, // mã xác nhận
    context: 'login' | 'register' | 'logout' // ngữ cảnh để xác định subject và nội dung email
  ) {

    // Nếu không có email người nhận, log cảnh báo và dừng hàm
    if (!to) {
      this.logger.warn(`Attempted to send ${context} code but user has no email`);
      return;
    }

    // Nếu chưa cấu hình from hoặc transporter, log cảnh báo và dừng hàm
    if (!this.from || !this.transporter) {
      this.logger.warn(`Mail credentials missing, skipping ${context} email`);
      return;
    }

    // Xác định tiêu đề email dựa trên context
    const subject =
      context === 'login'             // nếu context là login
        ? 'Mã xác nhận đăng nhập'     // subject login
        : context === 'logout'        // nếu context là logout
          ? 'Mã xác nhận đăng xuất'   // subject logout
          : 'Mã xác nhận đăng ký';    // mặc định là đăng ký

    // Tạo nội dung email dạng HTML
    const html = `<p>Xin chào,</p>
      <p>Mã xác nhận cho thao tác <strong>${context}</strong> của bạn là:</p>
      <h2 style="letter-spacing:4px">${code}</h2>
      <p>Mã có hiệu lực trong 5 phút.</p>
      <p>Trân trọng,<br/>Đội ngũ hỗ trợ</p>`;

    // HTML email sẽ được render trong client email của người nhận

    try {
      // Gửi email thông qua transporter
      await this.transporter.sendMail({
        from: this.from,  // người gửi
        to,               // người nhận
        subject,          // tiêu đề
        html,             // nội dung HTML
      });

      // Cơ chế:
      // 1. Nodemailer kết nối đến SMTP server (theo service: gmail,...)
      // 2. Authenticate bằng user/pass
      // 3. Gửi email tới server
      // 4. SMTP server chuyển tiếp đến mail server của người nhận
      // 5. Promise resolve khi gửi thành công, reject khi lỗi
    } catch (err) {
      // Nếu lỗi khi gửi email, log lỗi
      this.logger.error(`Unable to send ${context} email`, err as Error);
      // Nguyên lý: try/catch bắt Promise reject để tránh crash ứng dụng
    }
  }
}
