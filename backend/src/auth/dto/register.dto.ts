

// DTO để nhận thông tin đăng ký từ client.
export class RegisterDto {  
  username: string;   // username của user.

 
  password: string;   // password của user.

 
  role?: string;   // role của user.


  email: string; // email của user.
}


// RegisterDto là DTO để nhận thông tin đăng ký từ client.
// nhận username, password, role và email từ client.
// trả về username, password, role và email từ client.
// sử dụng để nhận thông tin đăng ký từ client.
// sử dụng để xử lý request đăng ký.
