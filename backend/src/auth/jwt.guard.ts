import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {} // Guard để xác thực JWT.

// JwtAuthGuard là guard để xác thực JWT.
// Nó sẽ kiểm tra xem request có JWT token không.
// Nếu có thì sẽ xác thực JWT token.
// Nếu không thì sẽ trả về lỗi 401.
