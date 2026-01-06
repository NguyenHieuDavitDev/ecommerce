import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {} // Inject AuthService để sử dụng các phương thức trong AuthService.

  @Post('register') // Đăng ký tài khoản.
  register(@Body() dto: RegisterDto) { // Nhận thông tin đăng ký từ client.
    return this.authService.register(dto.username, dto.password, dto.role, dto.email); // Gọi phương thức register trong AuthService để đăng ký tài khoản.
  } // Trả về message thành công và user đã đăng ký.

  @Post('login') // Đăng nhập.
  login(@Body() dto: LoginDto) { // Nhận thông tin đăng nhập từ client.
    return this.authService.login(dto.username, dto.password); // Gọi phương thức login trong AuthService để đăng nhập.
  } // Trả về message thành công và user đã đăng nhập.

  @Post('login/verify') // Xác minh OTP đăng nhập.
  verify(@Body() dto: VerifyLoginDto) { // Nhận thông tin xác minh OTP đăng nhập từ client.
    return this.authService.verifyLogin(dto.challengeId, dto.code); // Gọi phương thức verifyLogin trong AuthService để xác minh OTP đăng nhập.
  } // Trả về message thành công và user đã đăng nhập.

  @UseGuards(JwtAuthGuard)
  @Post('logout') // Đăng xuất.
  logout(@Req() req: any) { // Nhận thông tin đăng xuất từ client.
    return this.authService.logout(req.user.sub); // Gọi phương thức logout trong AuthService để đăng xuất.
  } // Trả về message thành công và user đã đăng xuất.
}

// AuthController là controller để xử lý các request liên quan đến Auth.
// Sử dụng các service và repository liên quan đến Auth.
// Sử dụng các module khác để sử dụng các service và repository liên quan đến Auth.



