
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class AuthService {
  constructor( 
    private usersService: UsersService, // Service quản lý user
    private jwtService: JwtService, // Service quản lý JWT
    private readonly mailService: MailService, // Service quản lý email
    private readonly verificationService: VerificationService, // Service tạo/kiểm tra mã OTP
  ) {}

  async register(username: string, password: string, role: string = 'user', email?: string) { 
    // Nếu không có email => báo lỗi
    if (!email) {
      throw new BadRequestException('Email là bắt buộc để đăng ký.');
    }
    // Tìm người dùng theo username chưa bị trùng.
    const existing = await this.usersService.findByUsername(username);
    // Nếu tìm thấy user → username đã tồn tại → không cho đăng ký.
    if (existing) throw new BadRequestException('User already exists');

    // Nếu username chưa tồn tại tạo user mới trong database.
    // Trong service create() sẽ tự handle việc hash mật khẩu.
    const user = await this.usersService.create({ username, password, roleName: role, email });
    // Nếu user có email thì tiến hành gửi OTP xác minh đăng ký.
    if (user.email) { // Nếu user có email thì tiến hành gửi OTP xác minh đăng ký.
      const { code } = await this.verificationService.createForUser(user as any, 'register');
      // Gửi email chứa mã OTP đến email của user.
      await this.mailService.sendVerificationCode(user.email, code, 'register');
      // Trả về message thành công và user đã đăng ký.
      // Và mã OTP đã được gửi tới email của user.
    }
    // Trả về message thành công và user đã đăng ký.
    return { message: 'Registered successfully. Please check your email for the verification code.', user };
  }

  async login(username: string, password: string) {
    // Tìm người dùng theo username.
    const user = await this.usersService.findByUsername(username);
    // Nếu không tìm thấy user → username không tồn tại → báo lỗi.
    if (!user) throw new UnauthorizedException('Invalid credentials');
    // So sánh mật khẩu đã nhập với mật khẩu đã lưu trong database.
    const isMatch = await bcrypt.compare(password, user.password);
    // Nếu mật khẩu không khớp báo lỗi.
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    // Nếu mật khẩu khớp tiến hành gửi OTP xác minh đăng nhập.

    // Nếu user không có email báo lỗi.
    if (!user.email) {
      // Vui lòng liên hệ quản trị viên.
      throw new BadRequestException('Tài khoản này chưa có email để nhận mã xác nhận. Vui lòng liên hệ quản trị viên.');
    }
    // Tạo mã OTP xác minh đăng nhập.
    const { token, code } = await this.verificationService.createForUser(user as any, 'login');
    // Nếu user có email thì tiến hành gửi OTP xác minh đăng nhập.
    if (user.email) { // Nếu user có email thì tiến hành gửi OTP xác minh đăng nhập.
      // Gửi email chứa mã OTP đến email của user.
      await this.mailService.sendVerificationCode(user.email, code, 'login');
      // Và mã OTP đã được gửi tới email của user.
    }
      // Trả về challengeId để người dùng nhập OTP vào form login.
    return {
      challengeId: token.id,  // ID của yêu cầu xác thực OTP, client cần gửi lại để verify
      message: 'Mã xác nhận đã được gửi tới email của bạn. Vui lòng nhập mã để tiếp tục.', // Message thành công.
      emailHint: user.email ? `${user.email.slice(0, 2)}***@${user.email.split('@')[1]}` : null,   // Ẩn phần email để tăng bảo mật.
    };
  }

  // ======================== VERIFY LOGIN (XÁC MINH OTP ĐĂNG NHẬP) ========================
  //  verifyLogin là phương thức để xác minh mã OTP đăng nhập được gửi từ email.
  //   - challengeId có khớp với mã OTP không
  //   - loại hành động = "login" (đăng nhập)
  //   - mã OTP có hết hạn chưa (5 phút)
  async verifyLogin(challengeId: string, code: string) { 
    // Kiểm tra mã OTP có khớp với mã OTP đã gửi tới email của user không.
    const verification = await this.verificationService.verifyCode(challengeId, code, 'login');
    // Nếu mã OTP không khớp với mã OTP đã gửi tới email của user báo lỗi.
    const user = verification.user;


    const payload = { sub: user.id, username: user.username, role: user.roleName };
    // Payload đưa vào JWT - chứa thông tin cơ bản để xác thực.
    // sub: user.id - ID của user.
    // username: user.username - username của user.
    // role: user.roleName - role của user.



    const token = await this.jwtService.signAsync(payload); // Tạo JWT token với payload trên.
    // Trả về access_token là JWT token và user là user đã đăng nhập.

    const { password: _pw, ...safeUser } = user as any;  // Loại bỏ trường password trước khi trả về client.
    safeUser.role = user.roleName;  // Thêm role vào user để trả về client.
    return { access_token: token, user: safeUser };  // Trả về access_token là JWT token và user là user đã đăng nhập.
  }

  
  // ======================== LOGOUT ========================

  async logout(userId: number) {
    // Tìm user theo ID.
    const user = await this.usersService.findById(userId);
    // Tạo mã OTP xác minh đăng xuất.
    const { code } = await this.verificationService.createLogoutCode(user as any);
    // Nếu user có email thì tiến hành gửi OTP xác minh đăng xuất.
    if (user.email) {
      // Gửi email chứa mã OTP đến email của user.
      await this.mailService.sendVerificationCode(user.email, code, 'logout');
      // Và mã OTP đã được gửi tới email của user.
      return { message: 'Đã gửi mã xác nhận đăng xuất tới email của bạn.' }; // Trả về message thành công.
    }
    return { message: 'Đã đăng xuất nhưng tài khoản chưa có email để nhận mã xác nhận.' }; // Trả về message thành công.
  }
}
