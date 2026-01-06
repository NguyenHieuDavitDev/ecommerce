import { Controller, Get, Patch, Body, UseGuards, Req, Post, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {
  // Hàm constructor này là nơi khởi tạo class UserController (hoặc class chứa constructor này)
  // NestJS sẽ tự động "inject" một instance của UsersService vào class này
  // Điều này nhờ cơ chế Dependency Injection (DI) của NestJS
  constructor(private usersService: UsersService) { }  // usersService là tên biến, kiểu UsersService

  // Public CRUD for admin UI (adjust guards as needed)
  // @Get(): decorator của NestJS
  // - Đánh dấu phương thức này là endpoint HTTP GET
  // - URL của endpoint sẽ là route của controller hiện tại (ví dụ /users nếu controller là @Controller('users'))
  @Get()

  // findAll(): tên phương thức trong controller
  // - Khi client gửi GET request tới /users, phương thức này sẽ được gọi
  findAll() {

    // this.usersService.findAll(): gọi service để lấy dữ liệu
    // - usersService là service được inject qua constructor (dependency injection)
    // - findAll() trong service sẽ truy vấn DB, trả về Promise<SafeUser[]>
    // - NestJS tự động xử lý Promise và trả về kết quả JSON cho client
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    // @Post() là HTTP decorator của NestJS,
    // dùng để định nghĩa route POST /users 
    //
    // @Body() lấy dữ liệu JSON mà client gửi lên trong phần body của request.
    // Thường dùng để tạo mới user (đăng ký, thêm người dùng…)
    //
    // this.usersService.create(body) gọi xuống tầng Service.
    // Controller chỉ nhận request → validate → gọi Service xử lý logic nghiệp vụ.
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    // @Patch(':id') định nghĩa route PATCH /users/:id
    // PATCH được dùng khi muốn cập nhật một phần thông tin (không phải cập nhật toàn bộ).
    //
    // @Param('id') lấy giá trị :id từ URL.
    // Ví dụ: PATCH /users/10 → id = "10".
    //
    // @Body() nhận dữ liệu cập nhật từ client.
    //
    // Number(id) chuyển id từ string sang number vì DB thường dùng dạng INT.
    // Gọi hàm usersService.updateProfile để xử lý logic cập nhật người dùng.
    return this.usersService.updateProfile(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // @Delete(':id') tạo route DELETE /users/:id
    // Ý nghĩa: dùng để xóa một user theo id.

    // @Param('id') lấy giá trị id từ URL.
    // Ví dụ: DELETE /users/5 → id = "5"

    // Number(id): convert id từ string sang number
    // vì DB thường dùng INT, không phải string.

    // Gọi xuống tầng Service để thực hiện logic xóa user.
    // Controller chỉ điều phối, không chứa logic nghiệp vụ.
    return this.usersService.delete(Number(id));
  }


  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    // @UseGuards(JwtAuthGuard) bảo vệ route bằng Guard.
    // Guard kiểm tra xem request có kèm token JWT hợp lệ hay không.
    // Nếu không có hoặc token sai → trả về 401 Unauthorized.
    //
    // Bản chất Guard chạy TRƯỚC khi vào controller.
    // Nếu Guard pass → NestJS cho phép chạy hàm getMe().

    // @Get('me') tạo endpoint GET /users/me
    // Dùng để lấy thông tin người dùng hiện tại (current logged-in user).

    // @Req() lấy toàn bộ request object từ Express.
    // Sau khi Guard xác thực JWT, NestJS sẽ nhúng payload của JWT vào req.user
    // Ví dụ payload token JWT:
    // { sub: 10, email: "abc@gmail.com", role: "user" }
    //
    // req.user.sub chính là id của user hiện tại.
    // (sub = subject là tiêu chuẩn trong JWT để chứa userId)

    // Tìm user theo id từ payload JWT.
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() body: any) {
    // @UseGuards(JwtAuthGuard)
    // Guard kiểm tra token JWT có hợp lệ hay không.
    // Không có token hoặc token sai → 401 Unauthorized.
    //
    // Nếu pass Guard, NestJS tự gắn thông tin user từ JWT vào req.user.
    // Trong JWT payload tiêu chuẩn có trường "sub" lưu userId.

    // @Patch('me') tạo endpoint PATCH /users/me
    // Dùng để cập nhật thông tin cá nhân của user đang đăng nhập
    // (không cần truyền id vào URL).

    // @Req() truy cập toàn bộ request object (Express).
    // req.user.sub chính là userId lấy từ JWT.

    // @Body() nhận dữ liệu cần cập nhật từ client.
    // Controller chỉ điều phối và gọi service xử lý logic.
    return this.usersService.updateProfile(req.user.sub, body);
  }


  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() body: any) {
    // Route POST /users/change-password
    // Dùng để đổi mật khẩu. Chỉ user đăng nhập mới được đổi.

    // Guard JWT kiểm tra xem user có đăng nhập hay chưa.
    // Nếu hợp lệ → req.user sẽ chứa thông tin userId lấy từ token.

    // body.oldPassword: mật khẩu cũ người dùng nhập
    // body.newPassword: mật khẩu mới người dùng muốn đổi
    // Tầng service sẽ thực hiện:
    // 1. Lấy user theo req.user.sub
    // 2. Kiểm tra oldPassword có đúng không (so sánh hash qua bcrypt)
    // 3. Hash newPassword
    // 4. Lưu vào DB

    await this.usersService.changePassword(
      req.user.sub,
      body.oldPassword,
      body.newPassword,
    );

    // Trả thông báo đơn giản về client.
    return { message: 'Password changed' };
  }

}


