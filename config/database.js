const { Sequelize } = require('sequelize');
require('dotenv').config(); // Nạp các biến môi trường

// Kiểm tra xem có biến DATABASE_URL không (ưu tiên cho môi trường production)
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('⚠️ Please check your Render environment variables');
  throw new Error('DATABASE_URL is not set in environment variables');
}

console.log('🔗 Connecting to database...');

// Khởi tạo Sequelize bằng chuỗi kết nối duy nhất
const sequelize = new Sequelize(
  process.env.DATABASE_URL, // Sử dụng trực tiếp chuỗi kết nối từ TiDB
  {
    dialect: 'mysql',
    logging: false,

    // === PHẦN SỬA LỖI QUAN TRỌNG NHẤT ===
    dialectOptions: {
      // BẮT BUỘC: Bật chế độ kết nối an toàn (SSL/TLS)
      // Đây là yêu cầu của TiDB Cloud để bảo mật dữ liệu.
      ssl: {
        // rejectUnauthorized: true, // Dòng này có thể gây lỗi trên một số môi trường
                                    // Hãy thử bỏ nó đi hoặc đặt là `false` nếu vẫn lỗi.
                                    // Với TiDB, thường chỉ cần một object `ssl` rỗng là đủ.
      }
    },
    
    // Thêm timeout và retry options
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    retry: {
      max: 3
    }
    // ===================================
  }
);

// Xuất đối tượng sequelize để các file khác có thể sử dụng
module.exports = sequelize;