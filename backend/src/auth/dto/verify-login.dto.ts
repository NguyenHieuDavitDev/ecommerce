export class VerifyLoginDto { // DTO để nhận thông tin xác minh OTP đăng nhập từ client.
  challengeId: string; // challengeId của user.
  code: string; // code của user.
}

// VerifyLoginDto là DTO để nhận thông tin xác minh OTP đăng nhập từ client.
// nhận challengeId và code từ client.
// trả về challengeId và code từ client.
// sử dụng để nhận thông tin xác minh OTP đăng nhập từ client.
// sử dụng để xử lý request xác minh OTP đăng nhập.


