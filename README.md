# Sachify Backend API

Backend API server cho ứng dụng đọc truyện Sachify, được xây dựng với Node.js, Express và MySQL.

## 🚀 Tính năng chính

- **Authentication & Authorization**: JWT, Google OAuth, phân quyền user/admin/author
- **Story Management**: CRUD truyện, chương, danh mục
- **User Management**: Đăng ký, đăng nhập, profile, bookmark
- **Reading Progress**: Theo dõi tiến độ đọc, lịch sử
- **Review & Rating**: Đánh giá, bình luận truyện
- **File Upload**: Hình ảnh, nội dung chương (Cloudinary, Firebase)
- **Search & Filter**: Tìm kiếm, lọc truyện theo nhiều tiêu chí
- **Admin Panel**: Quản lý users, stories, categories
- **Author Dashboard**: Quản lý truyện của tác giả

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL với Sequelize ORM
- **Authentication**: JWT, Passport.js
- **File Storage**: Cloudinary, Firebase Storage
- **Email**: Nodemailer
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm hoặc yarn

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd sachify_backend
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sachify_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@sachify.com

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,text/plain

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret
```

### 4. Cấu hình database
```bash
# Tạo database MySQL
mysql -u root -p
CREATE DATABASE sachify_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sachify_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sachify_db.* TO 'sachify_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Chạy migrations và seeders
```bash
# Tạo bảng và cấu trúc database
npm run db:migrate

# Thêm dữ liệu mẫu (optional)
npm run db:seed
```

### 6. Khởi chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start

# Debug mode
npm run debug
```

## 📁 Cấu trúc thư mục

```
sachify_backend/
├── config/                 # Cấu hình database, middleware
│   ├── database.js        # Cấu hình kết nối database
│   └── ...
├── controllers/           # Logic xử lý request
│   ├── authController.js  # Xử lý authentication
│   ├── storyController.js # Xử lý truyện
│   └── ...
├── middleware/            # Middleware functions
│   ├── authMiddleware.js  # JWT verification
│   ├── uploadMiddleware.js # File upload handling
│   └── ...
├── models/                # Database models (Sequelize)
│   ├── user.js           # User model
│   ├── story.js          # Story model
│   └── ...
├── routes/                # API routes
│   ├── authRoutes.js     # Authentication routes
│   ├── storyRoutes.js    # Story routes
│   └── ...
├── service/               # Business logic services
│   ├── cloudinaryService.js # Cloudinary integration
│   ├── firebaseService.js   # Firebase integration
│   └── ...
├── utils/                 # Utility functions
│   ├── asyncHandler.js   # Error handling wrapper
│   ├── email.js          # Email utilities
│   └── ...
├── .env                   # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
├── server.js             # Entry point
└── README.md             # This file
```

## 🔧 Scripts có sẵn

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "debug": "node --inspect server.js",
    "db:migrate": "sequelize db:migrate",
    "db:seed": "sequelize db:seed:all",
    "db:reset": "sequelize db:drop && sequelize db:create && sequelize db:migrate",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## 🌍 Chuyển đổi môi trường

### Development → Production

1. **Cập nhật biến môi trường**
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Production database
DB_HOST=your_production_db_host
DB_NAME=sachify_prod_db
DB_USER=your_prod_user
DB_PASSWORD=your_prod_password

# Production URLs
CORS_ORIGIN=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Production services
CLOUDINARY_CLOUD_NAME=your_prod_cloud_name
FIREBASE_PROJECT_ID=your_prod_project_id
```

2. **Cài đặt dependencies production**
```bash
npm ci --only=production
```

3. **Build và optimize**
```bash
# Nếu có build process
npm run build

# Hoặc chạy trực tiếp
NODE_ENV=production npm start
```

### Production → Development

1. **Cập nhật biến môi trường**
```env
NODE_ENV=development
PORT=5000
HOST=localhost

# Local database
DB_HOST=localhost
DB_NAME=sachify_dev_db
DB_USER=sachify_user
DB_PASSWORD=your_local_password

# Local URLs
CORS_ORIGIN=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

2. **Cài đặt dependencies development**
```bash
npm install
```

3. **Khởi chạy development server**
```bash
npm run dev
```

## 🔐 Biến môi trường quan trọng

### Bắt buộc
- `NODE_ENV`: Môi trường (development/production)
- `JWT_SECRET`: Secret key cho JWT tokens
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database credentials

### Quan trọng cho production
- `CORS_ORIGIN`: Domain được phép truy cập API
- `RATE_LIMIT_MAX_REQUESTS`: Giới hạn request rate
- `BCRYPT_ROUNDS`: Số vòng hash password
- `LOG_LEVEL`: Level logging (error, warn, info, debug)

### OAuth & Third-party services
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `CLOUDINARY_*`: Cloudinary configuration
- `FIREBASE_*`: Firebase configuration
- `EMAIL_*`: Email service configuration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Đăng xuất

### Stories
- `GET /api/stories` - Lấy danh sách truyện
- `GET /api/stories/:id` - Lấy chi tiết truyện
- `POST /api/stories` - Tạo truyện mới (Author)
- `PUT /api/stories/:id` - Cập nhật truyện (Author)
- `DELETE /api/stories/:id` - Xóa truyện (Author)

### Chapters
- `GET /api/chapters/:id` - Lấy nội dung chương
- `POST /api/chapters` - Tạo chương mới (Author)
- `PUT /api/chapters/:id` - Cập nhật chương (Author)
- `DELETE /api/chapters/:id` - Xóa chương (Author)

### Users
- `GET /api/users/profile` - Lấy profile user
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/users/bookmarks` - Lấy bookmark của user
- `POST /api/users/bookmarks` - Thêm bookmark

### Admin (Admin only)
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/stories` - Quản lý stories
- `GET /api/admin/categories` - Quản lý categories

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:coverage
```

## 📝 Logging

Logs được lưu trong thư mục `logs/`:
- `app.log` - Application logs
- `error.log` - Error logs
- `access.log` - Access logs

## 🔒 Security

- JWT authentication
- Password hashing với bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection (Sequelize)
- XSS protection
- Helmet.js security headers

## 🚀 Deployment

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Environment-specific configs
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.test` - Testing environment

## 🐛 Troubleshooting

### Database connection issues
```bash
# Kiểm tra MySQL service
sudo systemctl status mysql

# Kiểm tra connection
mysql -u sachify_user -p -h localhost
```

### Port already in use
```bash
# Tìm process sử dụng port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### JWT issues
- Kiểm tra `JWT_SECRET` trong `.env`
- Đảm bảo secret key đủ mạnh
- Kiểm tra token expiration

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem API docs tại `/api-docs`
- **Email**: minhvu2908b@gmail.com
