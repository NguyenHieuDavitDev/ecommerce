import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { VerificationPurpose, VerificationToken } from './verification.entity';
import { User } from '../users/users.entity';

@Injectable()
export class VerificationService {

  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationRepo: Repository<VerificationToken>,
    /*
      - là thuộc tính của service, dùng để làm việc với bảng verification_tokens
        trong database thông qua TypeORM.
    
      - Repository<VerificationToken> là “lớp trợ lý” do TypeORM tạo ra,
        cung cấp sẵn các hàm truy vấn DB:
            find(), findOne(), save(), update(), delete(), ...
         giúp thao tác với DB mà không cần viết SQL thủ công.
    
      - private: chỉ dùng được bên trong service này.
    
      - readonly: không cho gán lại giá trị sau khi constructor inject vào,
        để repository cố định và không bị thay đổi trong runtime.
    
      → có thể hiểu là công cụ chính để service truy cập
        và quản lý dữ liệu của entity VerificationToken.
    */

  ) { }

  private generateCode(): string {
    // Tạo mã OTP 6 số:
    // Math.random() trả về số thực trong khoảng [0, 1)
    //  Math.random() * 900000 tạo khoảng [0, 900000)
    //
    // 100000 + ... để kết quả luôn >= 100000
    // Tổng lại nằm trong khoảng [100000, 999999]
    //
    // Math.floor(...) để bỏ phần thập phân, giữ số nguyên.
    //
    // Cuối cùng .toString() để chuyển số thành chuỗi,
    // vì mã OTP thường được xử lý dạng string.
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createForUser(user: User, purpose: VerificationPurpose) {

    await this.cleanupExpired();
    // Dọn dẹp token đã hết hạn trước khi tạo token mới.
    // Giúp tránh DB bị đầy bởi các OTP cũ không còn sử dụng.

    const code = this.generateCode();
    // Tạo mã OTP 6 số ngẫu nhiên.


    // Tạo một instance VerificationToken nhưng chưa lưu vào DB.
    // verificationRepo.create() chỉ tạo object đúng cấu trúc entity,
    // không thực hiện INSERT.
    const token = this.verificationRepo.create({
      user,                   // Gán quan hệ ManyToOne
      userId: user.id,        // Lưu khóa ngoại (dùng khi cần truy vấn nhanh)
      code,                   // Mã OTP
      purpose,                // Mục đích: login / register / logout
      // Thời gian hết hạn: hiện tại + 5 phút
      // Date.now() tính theo milliseconds
      // 5 * 60 * 1000 = 5 phút
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const saved = await this.verificationRepo.save(token);
    // Lưu record vào database (INSERT vào bảng verification_tokens)
    // TypeORM sẽ trả về object đã được lưu, bao gồm id, createdAt...


    return { token: saved, code };
    // Trả về token đã lưu + phần code (OTP).
    // code được trả về để gửi email/SMS cho user.
  }

  async verifyCode(tokenId: string, code: string, purpose: VerificationPurpose): Promise<VerificationToken> {


    const token = await this.verificationRepo.findOne({ where: { id: tokenId, purpose }, relations: ['user'] });
    /**
 * B1: Lấy token từ database dựa vào:
 *   - tokenId: mã định danh token (UUID)
 *   - purpose: mục đích token (xác thực email, reset mật khẩu,...)
 * 
 * `relations: ['user']` giúp lấy luôn thông tin user gắn với token,
 * để sau khi verify thành công có thể thao tác tiếp (như đổi mật khẩu hoặc activate tài khoản)
 */


    if (!token) throw new NotFoundException('Không tìm thấy mã xác nhận');
    /**
 * B2: Nếu không tìm thấy token:
 *    → có thể người dùng nhập sai link, token không tồn tại,
 *      hoặc token đã bị xóa do hệ thống kiểm soát rác dữ liệu.
 *    → Báo lỗi 404 vì resource không tồn tại.
 */
    if (token.consumed) throw new BadRequestException('Mã đã được sử dụng');
    /**
 * B3: Kiểm tra token đã được sử dụng hay chưa.
 * 
 * Thuộc tính `consumed` giúp đảm bảo:
 *  - Token chỉ dùng được 1 lần (one-time-token)
 *  - Tránh tấn công replay attack (ai đó dùng lại token cũ)
 *
 * Nếu token.consumed = true → không cho phép dùng lại.
 */
    if (token.expiresAt.getTime() < Date.now()) throw new BadRequestException('Mã đã hết hạn');

    /**
     * B4: Kiểm tra token đã hết hạn chưa.
     * 
     * So sánh thời gian hết hạn (expiresAt) với thời gian hiện tại.
     * Nếu expiresAt < now → token đã quá hạn hiệu lực.
     * 
     * Điều này ngăn:
     *  - Người dùng dùng token quá hạn (ví dụ mã OTP 5 phút)
     *  - Tấn công brute force vì mã chỉ tồn tại trong thời gian rất ngắn
     */
    if (token.code !== code.trim()) throw new BadRequestException('Mã xác nhận không hợp lệ');
    /**
 * B5: So sánh mã người dùng nhập với mã lưu trong DB.
 * 
 * `trim()` loại bỏ khoảng trắng thừa.
 * Nếu khác nhau → mã không hợp lệ.
 * 
 * Đây là bước xác minh chính để khẳng định người dùng thật sự sở hữu
 * email/số điện thoại hoặc đang làm đúng thao tác reset mật khẩu.
 */
    token.consumed = true;
    /**
 * B6: Đánh dấu token là đã được sử dụng.
 * 
 * Đây là bước cực kỳ quan trọng:
 *   - Tránh dùng lại (one-time use)
 *   - Bảo mật trong quy trình xác minh email hoặc đổi mật khẩu
 * 
 * Sau khi token được dùng, nếu hacker có token thì cũng không thể dùng lại.
 */
    await this.verificationRepo.save(token);
    /**
 * B7: Lưu cập nhật vào database.
 * 
 * Token sẽ chuyển sang trạng thái “đã dùng”.
 * Lần sau nếu có ai cố verify lại token này → bị chặn ở bước B3.
 */
    return token;
    /**
   * B8: Trả về token đầy đủ kèm user.
   * 
   * Bên ngoài service có thể:
   *   - Kích hoạt tài khoản (active user)
   *   - Reset mật khẩu cho user
   *   - Gửi thông báo xác minh thành công
   * 
   * Tuỳ thuộc vào giá trị `purpose`.
   */
  }

  async createLogoutCode(user: User) {
    /**
 * Tạo mã xác thực (OTP) cho hành động đăng xuất tất cả thiết bị / xác thực đăng xuất.
 *
 * Lý do phải tạo mã logout:
 *  - Tăng bảo mật khi người dùng muốn "logout all" trên nhiều thiết bị.
 *  - Đảm bảo chính chủ đang yêu cầu đăng xuất, tránh hacker tự ý logout phiên của người khác.
 *  - Tái sử dụng logic đã có từ createForUser → giảm lặp code.
 *
 * nguyên lý hoạt động:
 *  - Gọi lại hàm createForUser(...) nhưng truyền purpose = 'logout'
 *  - Hệ thống sẽ tự tạo mã 6 số, đặt thời gian hết hạn, lưu vào DB.
 *  - Trả về token và code để gửi qua email/sms nếu cần.
 */
    return this.createForUser(user, 'logout');
  }

  private async cleanupExpired() {
      /*
    Mục đích:
    ---------
    - Xóa các mã xác thực (OTP) đã hết hạn quá lâu trong bảng verification_tokens.
    - Tránh database bị phình to bởi token cũ.
    - Giữ hệ thống gọn nhẹ và tối ưu truy vấn.

    Vì:
    - Mã xác thực thường được tạo rất nhiều (đăng nhập, đăng ký, logout…).
    - Mỗi mã chỉ có hạn dùng vài phút.
    - Nếu không dọn rác, DB sẽ chứa hàng chục nghìn đoạn mã.
    → Cleanup giúp tiết kiệm dung lượng và tăng tốc truy vấn.

    nguyên hoạt động:
    - Date.now() trả thời gian hiện tại (ms).
    - Trừ đi 10 * 60 * 1000 = 10 phút.
      là lấy mốc thời gian "10 phút trước".

    - LessThan(...) là toán tử của TypeORM.
      tạo câu SQL dạng:
        DELETE FROM verification_tokens
        WHERE expiresAt < {thời gian 10 phút trước}

    token nào đã hết hạn hơn 10 phút thì xóa luôn.
  */

    await this.verificationRepo.delete({
      expiresAt: LessThan(new Date(Date.now() - 10 * 60 * 1000)),
    });
  }
}


