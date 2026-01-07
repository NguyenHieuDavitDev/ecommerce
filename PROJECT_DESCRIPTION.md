# MÔ TẢ CHI TIẾT TOÀN BỘ DỰ ÁN E-COMMERCE

## TỔNG QUAN DỰ ÁN

Tên Dự Án: Ứng Dụng Thương Mại Điện Tử (E-Commerce Platform)

Mục Đích: Xây dựng một nền tảng thương mại điện tử hoàn chỉnh cho phép người dùng mua bán sản phẩm trực tuyến, quản lý đơn hàng, tương tác với cộng đồng thông qua blog và bình luận. Dự án cung cấp các tính năng thanh toán qua Momo, gửi hóa đơn qua email, xác thực người dùng bằng OTP, và nhiều tính năng nâng cao khác.

Phiên Bản: 1.0.0 (Beta)

Tác Giả: NguyenHieuDavitDev

Cập Nhật Lần Cuối: January 7, 2026

---

## KIẾN TRÚC TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────┐
│                   E-Commerce Platform                        │
└─────────────────────────────────────────────────────────────┘
           │                                       │
    ┌──────▼──────┐                        ┌──────▼──────┐
    │   Backend   │                        │  Frontend   │
    │  (NestJS)   │◄──────────────────────►│(React+Vite) │
    └──────┬──────┘                        └─────────────┘
           │
    ┌──────▼─────────────┐
    │   MySQL Database   │
    │    (TypeORM)       │
    └────────────────────┘
```

### Backend - API Server (Port 3001)
- Xử lý tất cả logic business
- Quản lý xác thực & phân quyền
- Lưu trữ & xử lý dữ liệu
- Gửi email & thông báo

### Frontend - Web Application (Port 5173)
- Giao diện người dùng responsive
- Tương tác trực tiếp với người dùng
- Hiển thị dữ liệu từ Backend
- Quản lý trạng thái toàn ứng dụng

---

## 🔐 Backend - NestJS API

### 1️⃣ Module Authentication (auth/)

**Chức Năng:**
- Xác thực người dùng thông qua JWT
- Đăng ký tài khoản mới
- Đăng nhập & đăng xuất
- Quản lý token & refresh token
- Phân quyền dựa trên Roles (RBAC)

**File Chính:**
- `auth.controller.ts` - Xử lý request
- `auth.service.ts` - Logic xác thực
- `jwt.strategy.ts` - Chiến lược JWT
- `jwt.guard.ts` - Bảo vệ route
- `roles.decorator.ts` - Decorator xác định role yêu cầu
- `get-user.decorator.ts` - Lấy thông tin user hiện tại

**Quy Trình:**
1. User gửi username/password
2. Backend xác minh thông tin
3. Phát hành JWT token
4. Client sử dụng token trong header Authorization
5. Backend verify token & cấp quyền truy cập

---

### 2️⃣ Module Products (product/)

**Chức Năng:**
- CRUD operations (Create, Read, Update, Delete)
- Quản lý hình ảnh sản phẩm
- Tìm kiếm & lọc sản phẩm
- Quản lý tồn kho (inventory)
- Định giá & chiết khấu

**File Chính:**
- `product.entity.ts` - Cấu trúc dữ liệu sản phẩm
- `product-image.entity.ts` - Lưu trữ hình ảnh
- `product.controller.ts` - API endpoints
- `product.service.ts` - Logic xử lý
- `dto/` - Data Transfer Objects cho validation

**Endpoints Chính:**
- `GET /products` - Lấy danh sách sản phẩm
- `GET /products/:id` - Chi tiết sản phẩm
- `POST /products` - Tạo sản phẩm (Admin)
- `PUT /products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /products/:id` - Xóa sản phẩm (Admin)
- `POST /products/:id/images` - Upload hình ảnh

---

### 3️⃣ Module Categories (category/)

**Chức Năng:**
- Phân loại sản phẩm
- Tạo danh mục cha/con
- Tìm kiếm sản phẩm theo danh mục
- Quản lý cấu trúc danh mục

**File Chính:**
- `category.entity.ts` - Entity danh mục
- `category.controller.ts` - API handlers
- `category.service.ts` - Business logic

**Ví Dụ Danh Mục:**
```
Electronics
├── Computers
│   ├── Laptops
│   └── Desktops
├── Mobile Phones
│   ├── Smartphones
│   └── Accessories
└── Tablets
```

---

### 4️⃣ Module Orders (order/)

**Chức Năng:**
- Tạo & quản lý đơn hàng
- Theo dõi trạng thái đơn hàng
- Quản lý các item trong đơn hàng
- Xử lý thanh toán & giao dịch
- Lịch sử đơn hàng

**File Chính:**
- `order.entity.ts` - Entity đơn hàng
- `order-item.entity.ts` - Chi tiết từng sản phẩm trong đơn
- `payment-transaction.entity.ts` - Giao dịch thanh toán
- `order.constants.ts` - Hằng số trạng thái đơn hàng
- `order.service.ts` - Logic xử lý đơn hàng

**Trạng Thái Đơn Hàng:**
- PENDING - Chờ xác nhận
- CONFIRMED - Đã xác nhận
- PROCESSING - Đang xử lý
- SHIPPED - Đã gửi
- DELIVERED - Đã giao
- CANCELLED - Đã hủy
- REFUNDED - Hoàn tiền

**Quy Trình Đặt Hàng:**
1. Customer chọn sản phẩm & tạo đơn hàng
2. Hệ thống xác thực tồn kho
3. Customer thực hiện thanh toán
4. Admin xác nhận & chuẩn bị hàng
5. Giao cho shipper & cập nhật trạng thái
6. Customer nhận hàng & đánh giá

---

### 5️⃣ Module Blogs (blogs/)

**Chức Năng:**
- Tạo & quản lý bài blog
- Quản lý nội dung bài viết
- Hỗ trợ hình ảnh đính kèm
- Cho phép bình luận trên bài blog
- Tìm kiếm bài viết

**File Chính:**
- `blog.entity.ts` - Entity bài blog
- `blogs.controller.ts` - API endpoints
- `blogs.service.ts` - Logic quản lý

**Tính Năng:**
- Editor WYSIWYG cho nội dung rich
- Tự động lưu nháp
- Publish/Unpublish bài viết
- Quản lý tác giả
- SEO metadata

---

### 6️⃣ Module Comments (comments/)

**Chức Năng:**
- Bình luận trên sản phẩm & blog
- Đính kèm hình ảnh trong bình luận
- Trả lời/nested comments
- Duyệt bình luận (moderation)
- Xóa spam/offensive comments

**File Chính:**
- `comment.entity.ts` - Entity bình luận
- `comment-image.entity.ts` - Hình ảnh bình luận
- `comments.service.ts` - Logic xử lý

**Tính Năng:**
- Rating/Vote cho bình luận
- Thông báo khi có reply
- Filter bình luận theo sao
- Admin can moderate comments

---

### 7️⃣ Module Flash Sales (flashsale/)

**Chức Năng:**
- Tạo đợt khuyến mãi giới hạn thời gian
- Quản lý thời gian bắt đầu & kết thúc
- Áp dụng chiết khấu cho sản phẩm
- Giới hạn số lượng sản phẩm
- Hiển thị đèn countdown

**File Chính:**
- `flashsale.entity.ts` - Entity flash sale
- `flashsale.controller.ts` - API endpoints
- `flashsale.service.ts` - Logic khuyến mãi

**Ví Dụ:**
```
Flash Sale - "Hạ Giá Siêu Sốc"
├── Thời gian: 14:00 - 18:00 hôm nay
├── Sản phẩm: Laptop XYZ
├── Giá gốc: 20,000,000 VND
├── Giá sale: 15,000,000 VND (25% off)
└── Số lượng: 50 cái
```

---

### 8️⃣ Module Users (users/)

**Chức Năng:**
- Quản lý profile người dùng
- Cập nhật thông tin cá nhân
- Quản lý địa chỉ giao hàng
- Lịch sử mua hàng
- Quản lý wishlist

**Dữ Liệu User:**
- Full name, email, phone
- Avatar/Profile picture
- Địa chỉ (primary & secondary)
- Thành phố, quốc gia
- Ngày tháng năm sinh
- Tài khoản ngân hàng (nếu cần)

---

### 9️⃣ Module Roles & Permissions (roles/)

**Chức Năng:**
- Định nghĩa roles khác nhau
- Gán permissions cho role
- Kiểm soát quyền truy cập

**Các Role:**
- **Admin** - Quản trị viên toàn bộ hệ thống
  - Quản lý người dùng, sản phẩm, đơn hàng
  - Tạo reports & analytics
  - Quản lý nhân viên
  
- **Moderator** - Kiểm duyệt nội dung
  - Duyệt bình luận & blog
  - Xóa nội dung vi phạm
  - Báo cáo thống kê
  
- **Supplier** - Nhà cung cấp sản phẩm
  - Đăng ký sản phẩm
  - Quản lý hàng của mình
  - Xem doanh số bán
  
- **User** - Người dùng thường
  - Xem sản phẩm
  - Đặt hàng
  - Bình luận

---

### 🔟 Module Verification (verification/)

**Chức Năng:**
- Xác thực email người dùng
- Gửi mã xác thực
- Verify tài khoản mới
- Two-factor authentication (2FA)

**Quy Trình:**
1. User đăng ký với email
2. Hệ thống gửi email với mã verify
3. User click link hoặc nhập mã
4. Tài khoản được kích hoạt

---

### 1️⃣1️⃣ Module Suppliers (supplier/)

**Chức Năng:**
- Quản lý thông tin nhà cung cấp
- Đăng ký nhà cung cấp mới
- Xem doanh số & thống kê
- Quản lý hàng tồn kho

**Thông Tin Supplier:**
- Tên công ty
- Địa chỉ & thành phố
- Số điện thoại & email
- Logo công ty
- Mô tả & đánh giá

---

### 1️⃣2️⃣ Module Statistics (statistics/)

**Chức Năng:**
- Thống kê doanh số bán
- Phân tích hành vi người dùng
- Báo cáo tồn kho
- Dự báo xu hướng

**Chỉ Số Chính:**
- Tổng doanh thu (hôm nay, tháng, năm)
- Số đơn hàng (tổng, hoàn thành, hủy)
- Số người dùng mới
- Sản phẩm bán chạy nhất
- Đánh giá & feedback

---

### 1️⃣3️⃣ Module Mail (mail/)

**Chức Năng:**
- Gửi email thông báo
- Email template
- Hỗ trợ HTML & plain text
- Scheduled email

**Email Template:**
- Welcome email cho user mới
- Order confirmation
- Shipping notification
- Delivery confirmation
- Password reset
- Promotional emails

---

## ⚛️ Frontend - React + Vite

### 🎨 Kiến Trúc Frontend

```
src/
├── api/              # API calls & axios configuration
├── assets/           # Images, fonts, videos
├── components/       # Reusable components
│   ├── Header/
│   ├── Footer/
│   ├── ProductCard/
│   ├── CartItem/
│   └── ...
├── layouts/          # Layout components
│   ├── MainLayout/
│   ├── AdminLayout/
│   └── ...
├── pages/            # Page components
│   ├── Home/
│   ├── Products/
│   ├── ProductDetail/
│   ├── Cart/
│   ├── Checkout/
│   ├── OrderHistory/
│   ├── Blog/
│   ├── Admin/
│   └── ...
├── App.jsx           # Main App component
├── main.jsx          # Entry point
├── App.css           # Global styles
└── index.css         # Base styles
```

### 📄 Các Page Chính

#### 1. **Home Page** (Trang Chủ)
- Banner/Carousel quảng cáo
- Danh sách sản phẩm nổi bật
- Flash sale countdown
- New products
- Best sellers
- Testimonials

#### 2. **Products Page** (Danh Sách Sản Phẩm)
- Grid/List view
- Filter theo danh mục
- Search functionality
- Sort (giá, đánh giá, mới nhất)
- Pagination
- Product quick view

#### 3. **Product Detail Page** (Chi Tiết Sản Phẩm)
- Hình ảnh sản phẩm (gallery)
- Thông tin cơ bản
- Mô tả chi tiết
- Đánh giá & bình luận
- Related products
- Add to cart / Buy now buttons

#### 4. **Shopping Cart** (Giỏ Hàng)
- Danh sách sản phẩm trong giỏ
- Quantity controls
- Tính tổng tiền
- Coupon/Discount code
- Continue shopping / Checkout

#### 5. **Checkout Page** (Thanh Toán)
- Delivery address
- Shipping method
- Payment method
- Order review
- Place order

#### 6. **Order History** (Lịch Sử Đơn Hàng)
- Danh sách đơn hàng
- Trạng thái đơn hàng
- Chi tiết đơn hàng
- Track shipment
- Reorder button

#### 7. **Blog Page** (Blog)
- Danh sách bài viết
- Read full article
- Comments & ratings
- Author info
- Related posts

#### 8. **User Profile** (Hồ Sơ Người Dùng)
- Account information
- Address book
- Wishlist
- Order history
- Payment methods
- Notifications preferences

#### 9. **Admin Dashboard** (Bảng Điều Khiển Admin)
- Sales overview
- Charts & graphs
- Recent orders
- Top products
- User analytics
- Quick links

#### 10. **Admin - Product Management**
- Table of all products
- Add/Edit/Delete product
- Bulk actions
- Stock management
- Category assignment

#### 11. **Admin - Order Management**
- All orders table
- Status filters
- Order details modal
- Print invoice
- Refund processing

#### 12. **Admin - User Management**
- User list
- User details
- Suspend/Activate user
- View user orders

---

## 🔗 API Endpoints (Chi tiết)

### Authentication Endpoints
```
POST   /auth/register        - Đăng ký
POST   /auth/login           - Đăng nhập
POST   /auth/logout          - Đăng xuất
POST   /auth/refresh-token   - Làm mới token
GET    /auth/me              - Lấy thông tin user hiện tại
```

### Product Endpoints
```
GET    /products             - Lấy danh sách sản phẩm
GET    /products/:id         - Chi tiết sản phẩm
POST   /products             - Tạo sản phẩm (Admin)
PUT    /products/:id         - Cập nhật sản phẩm (Admin)
DELETE /products/:id         - Xóa sản phẩm (Admin)
GET    /products/category/:id - Sản phẩm theo danh mục
POST   /products/:id/images  - Upload hình ảnh
```

### Order Endpoints
```
POST   /orders               - Tạo đơn hàng
GET    /orders               - Lấy danh sách đơn hàng của user
GET    /orders/:id           - Chi tiết đơn hàng
PUT    /orders/:id           - Cập nhật đơn hàng
GET    /orders/:id/invoice   - Lấy invoice (PDF)
POST   /orders/:id/cancel    - Hủy đơn hàng
```

### Category Endpoints
```
GET    /categories           - Danh sách danh mục
GET    /categories/:id       - Chi tiết danh mục
POST   /categories           - Tạo danh mục (Admin)
PUT    /categories/:id       - Cập nhật danh mục (Admin)
DELETE /categories/:id       - Xóa danh mục (Admin)
```

### Comment Endpoints
```
GET    /comments             - Lấy bình luận
POST   /comments             - Tạo bình luận
PUT    /comments/:id         - Cập nhật bình luận
DELETE /comments/:id         - Xóa bình luận
POST   /comments/:id/images  - Upload hình ảnh bình luận
```

### Blog Endpoints
```
GET    /blogs                - Danh sách blog
GET    /blogs/:id            - Chi tiết blog
POST   /blogs                - Tạo blog (Admin)
PUT    /blogs/:id            - Cập nhật blog (Admin)
DELETE /blogs/:id            - Xóa blog (Admin)
```

### User Endpoints
```
GET    /users/:id            - Chi tiết user
PUT    /users/:id            - Cập nhật profile
POST   /users/:id/avatar     - Upload avatar
GET    /users/:id/orders     - Đơn hàng của user
```

### Statistics Endpoints
```
GET    /statistics/sales     - Thống kê doanh số
GET    /statistics/orders    - Thống kê đơn hàng
GET    /statistics/users     - Thống kê người dùng
GET    /statistics/products  - Thống kê sản phẩm
```

---

## 🔐 Security & Authentication

### JWT Implementation
```
Client                              Server
  │                                    │
  ├─ POST /auth/login               ──>│
  │  (username, password)              │
  │                                    ├─ Verify credentials
  │                                    ├─ Generate JWT token
  │<─ {access_token, refresh_token} ──┤
  │                                    │
  ├─ GET /products                   ──>│
  │  Header: Authorization: Bearer JWT   │
  │                                    ├─ Verify token
  │<─ Products list                  ──┤
```

### Password Security
- Mật khẩu được hash bằng bcrypt
- Salt rounds: 10
- Never store plaintext passwords

### Role-Based Access Control (RBAC)
```
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Post('products')
createProduct() {
  // Only ADMIN can create products
}
```

---

## 📊 Database Schema Overview

### User Table
```sql
users {
  id (PK)
  email (UNIQUE)
  password (hashed)
  firstName
  lastName
  phone
  avatar
  role_id (FK)
  createdAt
  updatedAt
  isActive
}
```

### Product Table
```sql
products {
  id (PK)
  name
  description
  price
  category_id (FK)
  supplier_id (FK)
  stock
  rating
  imageUrl
  createdAt
  updatedAt
}
```

### Order Table
```sql
orders {
  id (PK)
  user_id (FK)
  totalAmount
  status (ENUM)
  shippingAddress
  createdAt
  updatedAt
}
```

### OrderItem Table
```sql
order_items {
  id (PK)
  order_id (FK)
  product_id (FK)
  quantity
  price
}
```

---

## 🚀 Quy Trình Triển Khai

### Development
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Run migrations
5. Start development servers
6. Access http://localhost:5173 (Frontend)

### Testing
```bash
cd backend
npm run test:cov          # Unit tests
npm run test:e2e          # End-to-end tests

cd frontend
npm run lint              # Check code quality
```

### Production Deployment
```bash
# Backend
npm run build
npm run start:prod

# Frontend
npm run build
# Deploy dist/ folder to web server
```

---

## 📈 Tính Năng Nâng Cao (Advanced Features)

### 1. Real-time Notifications
- WebSocket cho live updates
- Real-time order status
- Chat support

### 2. Inventory Management
- Low stock alerts
- Auto-reorder functionality
- Warehouse management

### 3. Payment Integration
- Multiple payment gateways
- Stripe, PayPal, etc.
- Invoice generation (PDF)

### 4. Recommendation Engine
- Based on purchase history
- Similar products
- Trending items

### 5. Analytics & Reporting
- Sales dashboard
- Customer insights
- Inventory reports

---

## 🛠️ Technology Stack Tóm Tắt

| Thành Phần | Công Nghệ | Phiên Bản |
|-----------|-----------|----------|
| Backend Framework | NestJS | 11.0.1 |
| Frontend Framework | React | 19.1.1 |
| Build Tool (Frontend) | Vite | - |
| Database | MySQL | - |
| ORM | TypeORM | 0.3.27 |
| Authentication | JWT + Passport | 11.0.1, 0.7.0 |
| HTTP Client | Axios | 1.12.2 |
| Password Hashing | bcrypt | 6.0.0 |
| Email Service | Nodemailer | 6.9.14 |
| PDF Generation | PDFKit, PDFMake | 0.15.0, 0.2.20 |
| UI Framework | Bootstrap | 5.3.8 |
| Icons | FontAwesome, React Icons | 7.1.0, 5.5.0 |
| Charts | Chart.js | 4.5.1 |
| Validation | Class-Validator | 0.14.2 |

---

## 🎓 Hướng Dẫn Sử Dụng

### Cho End User
1. Đăng ký tài khoản
2. Duyệt sản phẩm
3. Thêm vào giỏ hàng
4. Thanh toán
5. Theo dõi đơn hàng

### Cho Admin
1. Đăng nhập với tài khoản Admin
2. Truy cập Admin Dashboard
3. Quản lý sản phẩm/đơn hàng/người dùng
4. Xem thống kê

---

## 🐛 Known Issues & Future Improvements

### Current Limitations
- Single language support (Vietnamese)
- Email service requires configuration
- No mobile app yet

### Planned Features
- Multi-language support
- Mobile app (React Native)
- Advanced analytics
- AI-powered recommendations
- Live chat support
- Social media integration

---

## 📞 Support & Contact

- **Author**: NguyenHieuDavitDev
- **Repository**: [GitHub Link]
- **Issues**: Report bugs and request features on GitHub Issues

---

## 📄 License

UNLICENSED - All rights reserved

---

**Tài Liệu Được Cập Nhật**: January 7, 2026
