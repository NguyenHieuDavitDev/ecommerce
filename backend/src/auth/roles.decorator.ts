import { SetMetadata } from '@nestjs/common';
// SetMetadata:
//   - Một helper function của NestJS dùng để gắn metadata (dữ liệu bổ sung)
//     vào lớp hoặc vào method của controller.
//   - Metadata sau này có thể được truy xuất bởi Reflector trong Guard/Interceptor.
//   - Thường dùng để xây dựng decorator tùy chỉnh như @Roles(), @Permissions()…
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
// Roles(...roles: string[]):
//   - là một Custom Decorator.
//   - Nhận vào danh sách các role dưới dạng chuỗi, ví dụ: @Roles('ADMIN', 'MOD')
//   - SetMetadata('roles', roles):
//       Gắn metadata có key là 'roles'
//       value là mảng roles được truyền vào.
//   - Khi gắn lên method controller, NestJS sẽ lưu metadata này lại.
//   - Guard có thể đọc metadata này để kiểm tra role của user.
//
// Ví dụ:
//   @Roles('ADMIN')
//   getAllUsers() {}
//
// Khi đó metadata sẽ là:
//   key: 'roles'
//   value: ['ADMIN']



import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  // RolesGuard:
  //   - Guard dùng để kiểm tra quyền truy cập dựa trên role của user.
  //   - Sẽ được kích hoạt sau khi JWT Guard đã xác thực người dùng.
  constructor(private reflector: Reflector) { }
  // Inject Reflector vào để đọc metadata.
  // reflector.get(key, target) dùng để lấy metadata từ controller/method.

  canActivate(context: ExecutionContext): boolean {
    // canActivate:
    //   - Hàm bắt buộc khi implements CanActivate.
    //   - Trả về true thì cho phép request tiếp tục.
    //   - Trả về false thì dừng lại và trả về lỗi 403 Forbidden.
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    // reflector.get<string[]>('roles', handler):
    //   - Đọc metadata 'roles' từ method hiện tại (handler).
    //   - Nếu route có @Roles('ADMIN') thì requiredRoles = ['ADMIN']
    //   - Nếu route không có @Roles thì requiredRoles = undefined
    if (!requiredRoles) return true;
    // Nếu route không yêu cầu role gì thì cho phép truy cập luôn.
    // Đây là hành vi mặc định khi không gắn @Roles().
    const { user } = context.switchToHttp().getRequest();
    // context.switchToHttp():
    //   - Chuyển ExecutionContext sang môi trường HTTP.
    // getRequest():
    //   - Lấy đối tượng Request (giống Express Request).
    // Request lúc này đã được JWT Guard set req.user vào.
    //
    // Vì vậy "user" là object decode từ JWT, ví dụ:
    //   user = { id: 1, username: 'admin', role: 'ADMIN' }
    return requiredRoles.includes(user.role);
    // So sánh role của user với danh sách requiredRoles.
    //
    // Nếu user.role nằm trong requiredRoles → trả true (cho phép vào)
    // Nếu không nằm → false (bị chặn → Forbidden)
    //
    // kiểm tra phân quyền dựa trên vai trò.
  }
}
