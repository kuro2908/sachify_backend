const { Sequelize } = require('sequelize');
require('dotenv').config(); // Nạp các biến môi trường từ file .env

// Khởi tạo một đối tượng Sequelize để kết nối với database
const sequelize = new Sequelize(
   process.env.DATABASE_URL,
  {
    host: process.env.DB_HOST, // Host của database
    dialect: 'mysql', // Loại database đang dùng (mysql)
    logging: false, // Tắt việc in các câu lệnh SQL ra console cho gọn

    // === THÊM TÙY CHỌN DƯỚI ĐÂY ĐỂ SỬA LỖI MÚI GIỜ ===
    dialectOptions: {
      // Tùy chọn này đảm bảo các giá trị ngày/giờ được trả về dưới dạng chuỗi
      // thay vì bị chuyển đổi tự động, tránh các vấn đề múi giờ không mong muốn.
      dateStrings: true,
      typeCast: true,
    },
    // Đặt múi giờ cho kết nối là +07:00 (Giờ Việt Nam)
    // Mọi thao tác đọc/ghi thời gian sẽ được thực hiện theo múi giờ này.
    timezone: '+07:00', 
  }
);

// Xuất đối tượng sequelize để các file khác có thể sử dụng
module.exports = sequelize;
