import { IsString, MinLength, MaxLength } from 'class-validator';

// DTO để nhận thông tin đăng nhập từ client.
export class LoginDto {    
 
  username: string; // username của user.


  password: string; // password của user.
}


// LoginDto là DTO để nhận thông tin đăng nhập từ client.
// nhận username và password từ client.
// trả về username và password từ client.
// sử dụng để nhận thông tin đăng nhập từ client.
// sử dụng để xử lý request đăng nhập.
