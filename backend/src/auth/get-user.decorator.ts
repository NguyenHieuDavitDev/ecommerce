import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((_, ctx: ExecutionContext) => { // Tạo decorator để lấy user từ request.
  // _ là param decorator, ctx là context.
  const req = ctx.switchToHttp().getRequest(); // Lấy request từ context.
  return req.user; // Trả về user từ request.
});

// GetUser là decorator để lấy user từ request.
// Nó sẽ lấy user từ request và trả về user.
// Nếu không có user thì sẽ trả về null.