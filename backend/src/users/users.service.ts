import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';
import { Role } from '../roles/role.entity';

type SafeUser =                                    // Định nghĩa một kiểu dữ liệu mới tên là SafeUser
  Omit<User, 'password' | 'role'>                  //  Lấy toàn bộ field của User, nhưng bỏ (omit):
  //    - 'password': không bao giờ trả về cho client
  //    - 'role': object Role (vì ta sẽ thay thế bằng dữ liệu khác)
  &
  {
    role?: string;                                  // Thay vì trả về object Role thì trả về roleName (string)
    roleDetail?: Role;                              // thông tin đầy đủ về Role
  };


// scope" là một kiểm soát vòng đời của một provider. 
// Nó quy định khi nào một instance của provider được tạo và cách nó được chia sẻ trong ứng dụng, giúp quản lý trạng thái, tối ưu hiệu năng và tránh rò rỉ dữ liệu. 
// Ba loại scope chính là: Singleton (mặc định, một instance dùng chung cho toàn bộ ứng dụng)
// Request (tạo một instance mới cho mỗi yêu cầu HTTP) 
// Transient (tạo một instance mới cho mỗi lần được inject). 


@Injectable()
export class UsersService {

  // NestJS yêu cầu TypeORM cung cấp instance của UserRepository.
  // Khi module load, TypeORM sẽ đăng ký UserRepository vào IoC Container.
  // Decorator này giúp Nest lấy đúng repository dựa trên metadata của entity User.  
  constructor(
    @InjectRepository(User)
    // không cần tự tạo kết nối DB hay tự viết SQL.
    // Lấy repository (bộ truy cập CSDL) của bảng User từ TypeORM.

    private usersRepo: Repository<User>,
    // Biến usersRepo giữ một reference tới UserRepository đã được DI resolve.
    // service có thể thao tác trực tiếp với bảng users trong DB


    // Singleton là một mẫu thiết kế (design pattern) một lớp chỉ có một và duy nhất một thể hiện (instance) trong toàn bộ vòng đời của ứng dụng
    // lifecycle là trình tự xử lý các yêu cầu HTTP và các sự kiện xảy ra trong quá trình ứng dụng khởi động và tắt
    private readonly rolesService: RolesService,
    // NestJS DI Container tạo sẵn instance RolesService (singleton).
    // khi inject vào constructor tuân theo nguyên tắc IoC:  
    // - Service KHÔNG tự new RolesService  
    // - IoC Container chịu trách nhiệm quản lý vòng đời (lifecycle) của nó.
    // readonly không cho gán lại instance tránh ghi đè dependency.
  ) { }



  //======tìm theo tên===================//
  // truy vấn database cần thời gian cần phải chờ nên cần async/await.
  // Hàm trả về Promise
  // - Thành công thì trả về User
  // - Không tìm thấy thì trả về null
  async findByUsername(username: string): Promise<User | null> {

    // this.usersRepo Repository đại diện cho bảng "users".
    // Repository chịu trách nhiệm giao tiếp DB (tìm, thêm, sửa, xóa).
    //
    // findOne() là hàm của Repository dùng để lấy 1 bản ghi.
    // Promise nghĩa là thao tác bất đồng bộ, trả kết quả sau.
    //
    // Tham số { where: { username } }:
    //   - where: điều kiện lọc dữ liệu.
    //   - username: thuộc tính cột trong bảng.
    //   - giá trị username: tham số truyền vào hàm.
    //
    // TypeORM sẽ tự chuyển thành SQL:
    //   SELECT * FROM users WHERE username = '...' LIMIT 1;
    //
    // await: dừng hàm lại cho đến khi Promise trả kết quả.
    const user = await this.usersRepo.findOne({
      where: { username: username }
    });

    // Trả về user: nếu tìm được thì trả về đối tượng User;  
    // nếu không thì là null.
    return user;
  }

  //======Mã hoá thông tin nhạy cảm===================//
  private sanitize(user: User): SafeUser | null {
    // sanitize() xử lý dữ liệu user để loại bỏ thông tin nhạy cảm (password).
    // Trả về kiểu SafeUser hoặc null nếu không có user.


    if (!user) return null;
    // Nếu user là null/undefined thì trả về null luôn.

    const safe: any = { ...user };
    // Tạo bản sao của user bằng toán tử spread (...).
    // purpose: tránh sửa trực tiếp object gốc.
    // safe là kiểu any để có thể tùy ý thêm/xóa thuộc tính.

    delete safe.password;
    // Xóa trường password để tránh lộ thông tin nhạy cảm.

    safe.role = user.roleName;
    // Chuyển roleName (string) sang trường role của đối tượng SafeUser.

    safe.roleDetail = user.role;
    // Thêm thông tin chi tiết role (object Role từ quan hệ ManyToOne).

    return safe as SafeUser;
    // Ép kiểu về SafeUser để TypeScript hiểu kiểu dữ liệu trả về.

  }


  //======Tạo tài khoản===================//
  /**
  * Hàm create: tạo một người dùng mới 
  * Nguyên lý hoạt động:
  * 1. Nhận dữ liệu payload từ client (username, password, email, role, ...)
  * 2. Kiểm tra username và email có tồn tại trong DB không (Validation)
  * 3. Hash password để lưu an toàn (Security)
  * 4. Xác định role và đảm bảo role tồn tại trong DB
  * 5. Tạo entity User mới từ dữ liệu đã xử lý
  * 6. Lưu User vào DB (ORM xử lý insert)
  * 7. Loại bỏ thông tin nhạy cảm (password), chuẩn hóa role
  * 8. Trả về client dưới dạng SafeUser
  */

  async create(
    // payload: dữ liệu gửi từ client
    // Partial<User>: cho phép payload chỉ chứa 1 phần các trường User
    // & {...}: bắt buộc username, password; roleName/role là tùy chọn
    payload: Partial<User> & { username: string; password: string; roleName?: string; role?: string }
  ): Promise<SafeUser> {
    // Promise<SafeUser>: sẽ trả về một giá trị SafeUser trong tương lai
    // async/await giúp xử lý Promise dễ đọc, không dùng .then().catch() phức tạp

    // Destructuring: tách ra các trường quan trọng
    // username, password: bắt buộc từ client
    // roleName, role: quyền của user (chuỗi)
    // rest: chứa các trường còn lại (email, avatar, customerName,...)
    const { username, password, roleName, role, ...rest } = payload;

    // Xác định role cuối cùng cho user
    // Nếu client gửi roleName thì dùng roleName
    // Nếu không gửi roleName nhưng gửi role thì dùng role
    // Nếu không có cả hai thì mặc định là 'user'
    const targetRole = roleName || role || 'user';

    //  VALIDATION USERNAME 
    // usersRepo.findOne(): tìm 1 record trong DB
    // where: { username } điều kiện tìm kiếm
    // ORM sẽ chuyển thành SQL:
    // SELECT * FROM users WHERE username = '...' LIMIT 1
    // await: tạm dừng hàm cho tới khi Promise hoàn thành
    const existing = await this.usersRepo.findOne({ where: { username } });

    // Nếu username đã tồn tại thì ném lỗi
    // BadRequestException là class của NestJS
    // HTTP response 400 gửi về client
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    // VALIDATION EMAIL 
    // Nếu payload có email, kiểm tra email tồn tại chưa
    if (rest.email) {
      // Tìm kiếm email trong DB, trả về Promise<User|null>
      const existingEmail = await this.usersRepo.findOne({ where: { email: rest.email } });
      // Nếu email đã tồn tại thì ném lỗi
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    // HASH PASSWORD
    // bcrypt.hash(password, 10): tạo hash an toàn cho password
    // Salt là chuỗi ký tự ngẫu nhiên được thêm vào mật khẩu trước khi băm (hash).
    // Salt Rounds là số lần (hoặc độ phức tạp) mà thuật toán bcrypt phải lặp lại để tạo ra salt và hash.
    // 10: số salt rounds là tăng độ khó brute-force (Brute-force là thử mọi mật khẩu có thể cho đến khi đúng.)
    // bcrypt.hash trả về Promise<string>, await đợi hoàn thành
    const hashed = await bcrypt.hash(password, 10);

    //  ENSURE ROLE
    // Kiểm tra role tồn tại trong DB chưa
    // rolesService.ensureRole(targetRole): trả về Role entity
    // Nếu role chưa tồn tại thì tạo mới trong DB
    // Role entity gồm id, name và quan hệ ManyToOne với User
    const roleEntity = await this.rolesService.ensureRole(targetRole);

    // TẠO ENTITY USER MỚI
    // usersRepo.create() tạo instance User chưa lưu vào DB
    // Trường username, password, roleId, role, roleName,... được gán từ payload và xử lý
    const user = this.usersRepo.create({
      username,             // tên đăng nhập
      password: hashed,     // password đã hash
      roleId: roleEntity.id,// id của role
      role: roleEntity,     // object Role (ManyToOne)
      roleName: roleEntity.name, // tên role dạng chuỗi
      ...rest,              // các trường còn lại từ payload (email, avatar,...)
    });

    //  LƯU USER VÀO DB 
    // usersRepo.save(user): insert entity vào DB
    // trả về Promise<User> await tạm dừng hàm cho tới khi DB trả về entity đã lưu
    // ORM tự động tạo ID, createdAt, updatedAt
    const saved = await this.usersRepo.save(user);

    //  SANITIZE DATA 
    // Loại bỏ password
    // Chuẩn hóa role:
    // - role: string
    // - roleDetail: object Role
    // Trả về client SafeUser đảm bảo không lộ thông tin nhạy cảm
    return this.sanitize(saved) as SafeUser;
  }



  /**
 * ================Hàm updateProfile: cập nhật thông tin cá nhân của một user .
 *
 * Luồng hoạt động:
 * 1. Nhận userId và dữ liệu update từ client.
 * 2. Loại bỏ các trường nhạy cảm (password, role, roleName) để tránh client thay đổi.
 * 3. Nếu có email mới, kiểm tra email đó đã tồn tại cho người dùng khác chưa.
 * 4. Cập nhật dữ liệu còn lại vào database.
 * 5. Lấy lại dữ liệu user vừa update từ database để đảm bảo dữ liệu chính xác.
 * 6. Nếu không tìm thấy user, ném NotFoundException.
 * 7. Loại bỏ các thông tin nhạy cảm (password), chuẩn hóa role (sanitize).
 * 8. Trả về SafeUser cho client.
 */

  async updateProfile(
    userId: number, // id của user cần cập nhật, dùng để xác định bản ghi trong DB
    data: Partial<User> // dữ liệu cập nhật từ client, có thể chỉ chứa một phần trường của User
  ): Promise<SafeUser> { // Hàm trả về Promise của SafeUser, tức là giá trị sẽ có trong tương lai


    // Bước 1: Loại bỏ các trường nhạy cảm 
    // Destructuring loại bỏ password, role, roleName
    // Các trường còn lại được phép cập nhật sẽ được lưu trong biến rest
    const {
      password: ignoredPassword, // Không cho phép client thay đổi password trực tiếp
      role: ignoredRole,          // Không cho phép client thay đổi object role trực tiếp
      roleName: ignoredRoleName,  // Không cho phép client thay đổi roleName trực tiếp
      ...rest                     // rest chứa các trường hợp lệ có thể update (email, avatarUrl,...)
    } = data as any;

    // Bước 2: Kiểm tra email mới 
    // Nếu client gửi email mới
    if (rest.email) {
      // Tìm user khác có email giống email mới
      // usersRepo.findOne trả về Promise<User | null>
      // await đợi DB trả về kết quả
      const emailOwner = await this.usersRepo.findOne({
        where: {
          email: rest.email, // điều kiện: email trùng
          id: Not(userId)    // loại trừ chính user đang update
        }
      });

      // Nếu email đã tồn tại cho người dùng khác
      // Ném lỗi BadRequestException (HTTP 400) để client biết
      if (emailOwner) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    // Bước 3: Cập nhật dữ liệu vào DB 
    // usersRepo.update nhận 2 tham số:
    // - id: xác định bản ghi cần update
    // - rest: các trường dữ liệu được phép update
    // Trả về Promise<UpdateResult> (không trả về entity)
    // await: đợi DB thực hiện xong update
    await this.usersRepo.update(userId, rest);

    // Bước 4: Lấy lại dữ liệu user vừa update 
    // usersRepo.findOne({ where: { id: userId } }) trả về Promise<User | null>
    // await đợi Promise hoàn thành, lấy entity user đã cập nhật
    const updated = await this.usersRepo.findOne({ where: { id: userId } });

    // Bước 5: Kiểm tra user tồn tại 
    // Nếu không tìm thấy user trong DB thì ném lỗi NotFoundException (HTTP 404)
    if (!updated) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Bước 6: Loại bỏ thông tin nhạy cảm 
    // Hàm sanitize:
    // - loại bỏ password
    // - chuẩn hóa role:
    //    + role: chuỗi
    //    + roleDetail: object Role
    // Trả về SafeUser cho client
    return this.sanitize(updated) as SafeUser;
  }


  /**
   * Hàm changePassword: thay đổi mật khẩu của user
   * Luồng hoạt động :
   * 1. Lấy user từ database theo userId
   * 2. Nếu không tìm thấy user → ném NotFoundException
   * 3. So sánh mật khẩu cũ do client nhập với mật khẩu trong DB
   * 4. Nếu không khớp → ném BadRequestException
   * 5. Hash mật khẩu mới bằng bcrypt
   * 6. Cập nhật mật khẩu mới vào DB
   */

  async changePassword(
    userId: number,         // id của user cần đổi mật khẩu
    oldPassword: string,    // mật khẩu cũ do client gửi lên
    newPassword: string     // mật khẩu mới do client gửi lên
  ): Promise<void> {        // Promise<void> nghĩa là hàm trả về một giá trị cụ trong tương lai


    //  Bước 1: Lấy user từ database 
    // usersRepo.findOne tìm user theo id
    // where: { id: userId } là điều kiện tìm kiếm
    // Trả về Promise<User | null>, await đợi Promise hoàn thành
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    //  Bước 2: Kiểm tra user tồn tại 
    // Nếu user không tồn tại trong DB thì ném NotFoundException
    if (!user) {
      throw new NotFoundException('User not found'); // HTTP 404
    }

    //  Bước 3: So sánh mật khẩu cũ 
    // bcrypt.compare so sánh plaintext password với hashed password trong DB
    // Trả về Promise<boolean>, await để lấy kết quả
    const match = await bcrypt.compare(oldPassword, user.password);

    // Nếu mật khẩu cũ không khớp thì ném lỗi BadRequestException
    if (!match) {
      throw new BadRequestException('Invalid current password'); // HTTP 400
    }

    //  Bước 4: Hash mật khẩu mới 
    // bcrypt.hash hash mật khẩu mới, 10 là số rounds (độ mạnh của hash)
    // Trả về Promise<string>, await để lấy giá trị hash
    const hashed = await bcrypt.hash(newPassword, 10);

    //  Bước 5: Cập nhật mật khẩu mới vào database 
    // usersRepo.update(userId, { password: hashed })
    // Cập nhật trực tiếp trường password
    // Trả về Promise<UpdateResult>, await để đảm bảo update đã hoàn tất
    await this.usersRepo.update(userId, { password: hashed });

    // Hàm không trả về dữ liệu nào (void)
  }

  /**
   * Hàm findAll: truy xuất tất cả bản ghi User từ database
   * Trả về: Promise chứa một mảng SafeUser (dữ liệu đã loại bỏ thông tin nhạy cảm)
   */
  async findAll(): Promise<SafeUser[]> {
    // Gọi repository để thực hiện SELECT * FROM users
    // usersRepo.find() trả về Promise<User[]>
    // await tạm dừng luồng hàm cho đến khi DB trả về kết quả
    const list = await this.usersRepo.find();

    // map qua từng entity User, gọi hàm sanitize để loại bỏ password
    // ép kiểu sang SafeUser để trả về client
    return list.map((u) => this.sanitize(u) as SafeUser);
  }


  /**
   * Hàm findById: truy xuất một bản ghi User theo khóa chính (primary key)
   * id: primary key của entity User
   * Trả về: Promise chứa một SafeUser
   */
  async findById(id: number): Promise<SafeUser> {

    // Thực hiện truy vấn SELECT * FROM users WHERE id = ?
    // findOne trả về Promise<User | null>
    const user = await this.usersRepo.findOne({ where: { id } });

    // Nếu không tìm thấy entity tương ứng trong DB → ném NotFoundException
    // Đây là cơ chế exception handling, client sẽ nhận HTTP 404
    if (!user) throw new NotFoundException('User not found');

    // sanitize loại bỏ các trường nhạy cảm như password
    // trả về SafeUser, client chỉ nhận dữ liệu an toàn
    return this.sanitize(user) as SafeUser;
  }


  /**
   * Hàm delete: xóa một bản ghi User theo primary key
   * userId: primary key của entity cần xóa
   * Trả về: Promise<void> vì không trả dữ liệu nào
   */
  async delete(userId: number): Promise<void> {

    // Thực hiện DELETE FROM users WHERE id = ?
    // delete trả về DeleteResult chứa thông tin affected rows
    const result = await this.usersRepo.delete(userId);

    // Kiểm tra affected rows = 0 nghĩa là không có bản ghi nào bị xóa
    // ném lỗi NotFoundException
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

}
