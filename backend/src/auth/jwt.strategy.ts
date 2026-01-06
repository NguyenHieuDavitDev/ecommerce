import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // PassportStrategy(Strategy): kế thừa xác thực JWT của passport-jwt.
  // Strategy: (strategy) được import từ passport-jwt.
  // JwtStrategy sẽ trở thành 1 xác thực tùy chỉnh trong NestJS.

  constructor(private readonly configService: ConfigService) {
    // ConfigService: lấy biến môi trường từ file .env hoặc cấu hình nội bộ.
    // private readonly: tự tạo thuộc tính trong class, chỉ đọc, không sửa được.
    super({       // super() gọi constructor của PassportStrategy để cấu hình JWT.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // jwtFromRequest:
      //   - Chỉ định cách lấy JWT từ request HTTP.
      //   - ExtractJwt.fromAuthHeaderAsBearerToken(): 
      //       lấy token từ header Authorization: Bearer <token>
      // Cơ chế:
      //   1. Client gửi request kèm Header: Authorization: Bearer eyJhbGciOi...
      //   2. Passport tách phần token sau từ "Bearer "
      //   3. Token được chuyển cho passport-jwt để verify
      secretOrKey: configService.get<string>('JWT_SECRET', 'please-change-me'),
      // secretOrKey:
      //   - Khóa bí mật dùng để verify token.
      //   - Lấy từ ENV: JWT_SECRET
      //   - Nếu không có, dùng 'please-change-me' (không an toàn khi chạy production)
      // Cơ chế:
      //   - Passport sẽ decode và verify token bằng khóa bí mật này.
    });
  }

  async validate(payload: any) {
    // validate(): hàm bắt buộc của JWT Strategy.
    // payload: dữ liệu được giải mã từ JWT (không phải token gốc)
    // Ví dụ payload:
    // {
    //   sub: 1,
    //   username: "admin",
    //   role: "ADMIN",
    //   iat: 1731231231,
    //   exp: 1731234831
    // }

    // hoạt động:
    // 1. Token được verify thành công thì Passport gọi validate()
    // 2. Trả về object thì object này sẽ được gắn vào req.user
    // 3. Bất kỳ Guard nào dùng AuthGuard('jwt') đều truy cập được req.user
    return { sub: payload.sub, username: payload.username, role: payload.role };
    // Trả về thông tin người dùng cần thiết.
    // sub: "subject", id của user (theo chuẩn JWT RFC 7519)
    // username: tên đăng nhập
    // role: phân quyền (ADMIN, USER...)
    //
    // Kết quả sau validate sẽ là req.user = { sub, username, role }
  }
}
