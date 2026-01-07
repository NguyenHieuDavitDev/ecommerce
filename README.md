# Ứng Dụng Thương Mại Điện Tử (E-Commerce Platform)

## Mô Tả Dự Án

Đây là một nền tảng thương mại điện tử đầy đủ tính năng, được xây dựng với kiến trúc hiện đại bao gồm Backend API và Frontend Web Application. Dự án hỗ trợ các chức năng mua bán sản phẩm, quản lý đơn hàng, xác thực người dùng, và nhiều tính năng nâng cao khác.

## Kiến Trúc Dự Án

Dự án được chia thành 2 phần chính:

```

├── backend/          # API Backend (NestJS)
└── frontend/         # Web Frontend (React + Vite)
```

---

## Backend (NestJS)

### Công Nghệ Sử Dụng
- **Framework**: NestJS 11.0.1
- **Database**: MySQL (TypeORM)
- **Authentication**: JWT + Passport
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit, PDFMake
- **Validation**: Class-Validator, Class-Transformer
- **Security**: bcrypt

### Cấu Trúc Module Backend

#### 1. **Authentication (auth/)**
- JWT Strategy & Guard
- Role-based Access Control (RBAC)
- User decorator
- Login & Register functionality

#### 2. **Products (product/)**
- CRUD operations for products
- Product images management
- Product filtering and search
- Inventory management

#### 3. **Blogs (blogs/)**
- Blog creation and management
- Blog comments support
- Rich content management

#### 4. **Comments (comments/)**
- Product & Blog comments
- Comment images/attachments
- Comment moderation

#### 5. **Categories (category/)**
- Product categorization
- Category management
- Hierarchical structure

#### 6. **Orders (order/)**
- Order creation and tracking
- Order items management
- Payment transaction handling
- Order status management (constants defined in order.constants.ts)

#### 7. **Flash Sales (flashsale/)**
- Time-limited promotional sales
- Flash sale management
- Discount application

#### 8. **Users (users/)**
- User profile management
- User account operations
- Password management

#### 9. **Roles (roles/)**
- Role definition and management
- Permission control

#### 10. **Verification (verification/)**
- Email verification
- User account verification

#### 11. **Suppliers (supplier/)**
- Supplier management
- Supplier information

#### 12. **Statistics (statistics/)**
- Sales analytics
- User statistics
- Order analytics

#### 13. **Mail Service (mail/)**
- Email sending service
- Email template support
- Nodemailer integration

### API Server Configuration
- **Port**: 3001 (configurable via APP_PORT)
- **CORS**: Enabled for all origins
- **Static Assets**: Uploads folder at `/uploads`
- **Global Pipes**: Validation transformation enabled

### Fonts Support
- Noto Sans Regular
- Roboto Regular
(Được sử dụng cho PDF generation)

---

## Frontend (React + Vite)

### Công Nghệ Sử Dụng
- **Framework**: React 19.1.1
- **Build Tool**: Vite
- **Styling**: Bootstrap 5.3.8
- **HTTP Client**: Axios
- **Routing**: React Router v7.9.4
- **Icons**: React Icons, FontAwesome
- **Charts**: Chart.js + react-chartjs-2
- **Package Manager**: npm

### Tính Năng Frontend
- Responsive design với Bootstrap
- Dynamic routing với React Router
- API integration với Axios
- Chart visualization cho analytics
- Icon library cho UI components
- ESLint configuration cho code quality

### Structure
```
frontend/src/
├── api/           # API calls and services
├── assets/        # Static assets (images, etc)
├── components/    # Reusable React components
├── layouts/       # Layout components
├── pages/         # Page components
├── App.jsx        # Main App component
├── main.jsx       # Entry point
├── App.css        # App styles
└── index.css      # Global styles
```

---

## Tính Năng Chính

### Cho Người Dùng (Customer)
- Đăng ký và đăng nhập tài khoản
- Xem và tìm kiếm sản phẩm
- Lọc sản phẩm theo danh mục
- Xem chi tiết sản phẩm với hình ảnh
- Bình luận trên sản phẩm và blog
- Tạo đơn hàng
- Theo dõi trạng thái đơn hàng
- Quản lý thanh toán
- Xem các blog và bài viết
- Tham gia flash sales

### Cho Quản Trị (Admin)
- Quản lý sản phẩm (CRUD)
- Quản lý danh mục
- Quản lý người dùng
- Quản lý đơn hàng
- Quản lý nhà cung cấp
- Tạo và quản lý flash sales
- Quản lý blog và bình luận
- Xem thống kê và báo cáo
- Gửi email thông báo
- Quản lý roles và permissions

---

## Cài Đặt và Chạy Dự Án

### Backend Setup

```bash
cd backend
npm install
```

**Environment Variables** (.env):
```
APP_PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=ecommerce
JWT_SECRET=your_jwt_secret
```

**Chạy Backend**:
```bash
# Development mode
npm run start:dev

# Production
npm run start:prod

# Build
npm run build
```

### Frontend Setup

```bash
cd frontend
npm install
```

**Chạy Frontend**:
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Testing

### Backend Testing
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 📝 Code Quality

### Linting và Formatting

**Backend**:
```bash
npm run lint       # Fix linting issues
npm run format     # Format code with Prettier
```

**Frontend**:
```bash
npm run lint       # Check ESLint
```

---

## File Structure Highlights

### Backend Key Files
- `src/main.ts` - Application entry point
- `src/app.module.ts` - Root module
- `src/app.controller.ts` - Root controller
- `src/app.service.ts` - Root service
- Database entities trong mỗi module
- DTO files cho validation

### Frontend Key Files
- `index.html` - HTML entry point
- `vite.config.js` - Vite configuration
- `src/main.jsx` - React entry point
- `src/App.jsx` - Main App component

---

## Security Features

- JWT-based authentication
- Password hashing với bcrypt
- Role-based access control
- Input validation với class-validator
- CORS enabled
- Email verification support

---

## Email Integration

- **Service**: Nodemailer
- **Use Cases**: User verification, order notifications, password reset
- **Configuration**: Configurable via environment variables

---

## Database

- **Type**: MySQL
- **ORM**: TypeORM
- **Entities**: Defined cho mỗi module (products, orders, users, blogs, etc)
- **Migrations**: Support thông qua TypeORM

---

## Upload Management

**Supported Upload Directories**:
```
uploads/
├── blogs/       # Blog images
├── comments/    # Comment images/attachments
├── products/    # Product images
└── suppliers/   # Supplier images
```

---

## 👥 Role Management

Dự án hỗ trợ nhiều roles khác nhau với permissions tương ứng:
- **Admin**: Full access
- **User**: Standard user operations


---

## Analytics & Statistics

- Sales analytics
- User statistics
- Order insights
- Chart visualization support

---

## Troubleshooting

### Backend Issues
1. Database connection: Kiểm tra MySQL service đang chạy
2. Port conflict: Thay đổi APP_PORT trong .env
3. CORS errors: Backend đã enable CORS cho tất cả origins

### Frontend Issues
1. API connection: Kiểm tra backend URL configuration
2. Port conflict: Vite sử dụng port 5173 mặc định
3. Module errors: Chạy `npm install` lại

---

## License

UNLICENSED

---

##  Author

Developed by NguyenHieuDavitDev

---

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

---

 January 7, 2026