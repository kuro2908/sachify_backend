const express = require('express');
const cors = require('cors'); // Thêm cors
require('dotenv').config();
const sequelize = require('./config/database');
const { defineAssociations } = require('./models/association');
const chapterRoutes = require('./routes/chapterRoutes'); 
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const commentRoutes = require('./routes/commentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authorRoutes = require('./routes/authorRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const readingHistoryRoutes = require('./routes/readingHistoryRoutes');

// Import các routes
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// CORS configuration for development, port forwarding, and production
app.use(cors({
  origin: [
    // Local development
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    
    // Vercel frontend domains (add your actual Vercel URL here)
    'sachify-frontend-gohlc4ofu-kuros-projects-e99bc0fe.vercel.app',
    'sachify.id.vn',
    
    // Development port forwarding
    /^https?:\/\/.*\.vercel\.app$/,
    /^https?:\/\/.*\.devtunnels\.ms$/,
    /^https?:\/\/.*\.ngrok\.io$/,
    
    // Allow all origins for development (you can restrict this in production)
    /^https?:\/\/.*$/,
    /^http:\/\/.*$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json()); // Để parse JSON từ request body
app.use(express.urlencoded({ extended: true })); // Để parse form data


// Sử dụng các Routes
// Mọi request đến /api/auth sẽ được xử lý bởi authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reading-history', readingHistoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Route mặc định
app.get('/', (req, res) => {
    res.send('Server API cho Web Truyện đang chạy!');
});

app.use(errorHandler); // xử lí lỗi tập trung

// === BẮT ĐẦU PHẦN SỬA LỖI ASSOCIATION ===

// Hàm khởi tạo kết nối và định nghĩa quan hệ
async function initialize() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối đến database thành công!');
    
    // GỌI HÀM ĐỊNH NGHĨA QUAN HỆ TẠI ĐÂY
    // Đây là bước quan trọng nhất để sửa lỗi "not associated"
    defineAssociations();
    console.log('✅ Các mối quan hệ đã được định nghĩa!');

    // Chỉ khởi động server sau khi mọi thứ đã sẵn sàng
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server đang lắng nghe tại http://localhost:${PORT}`);
      console.log(`Server cũng có thể truy cập từ các thiết bị khác qua IP của máy`);
    });

  } catch (error) {
    console.error('❌ Không thể khởi tạo ứng dụng:', error);
    process.exit(1); // Thoát tiến trình nếu không kết nối được DB
  }
}

// Gọi hàm khởi tạo để bắt đầu ứng dụng
initialize();

// === KẾT THÚC PHẦN SỬA LỖI ASSOCIATION ===

// Phần code cũ bị thay thế bởi hàm initialize()
/*
async function testDbConnection() {
  console.log('Đang kiểm tra kết nối đến database...');
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối đến database thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối đến database:', error);
  }
}
testDbConnection();

app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại http://localhost:${PORT}`);
});
*/