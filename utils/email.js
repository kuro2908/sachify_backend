const nodemailer = require('nodemailer');

// Tạo transporter cho Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Hàm gửi email
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"Sachify" <${process.env.EMAIL_USERNAME}>`,
            to: options.email,
            subject: options.subject,
            html: options.message
        };

        await transporter.sendMail(mailOptions);
        console.log('Email đã được gửi thành công');
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};

// Hàm tạo template email reset password
const createPasswordResetEmail = (resetURL, username) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Đặt lại mật khẩu - Sachify</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .logo {
                width: 80px;
                height: 80px;
                background-color: white;
                border-radius: 50%;
                margin: 0 auto 15px;
                display: inline-block;
                text-align: center;
                vertical-align: middle;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px 20px;
                border-radius: 0 0 10px 10px;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
            }
            .brand {
                font-weight: bold;
                color: #667eea;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">
                <img src="https://res.cloudinary.com/dlhbwgcej/image/upload/v1753973875/Sachify_logo_izfx3b.png" alt="Sachify" style="width: 60px; height: 60px; border-radius: 50%;">
            </div>
            <h1>Đặt lại mật khẩu</h1>
            <p style="margin: 0; opacity: 0.9;">Sachify - Nền tảng đọc truyện trực tuyến</p>
        </div>
        <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trên <span class="brand">Sachify</span>.</p>
            
            <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
                <a href="${resetURL}" class="button">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc bạn có thể copy và paste link này vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetURL}</p>
            
            <p><strong>Lưu ý:</strong></p>
            <ul>
                <li>Link này chỉ có hiệu lực trong 10 phút</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Để bảo mật, vui lòng không chia sẻ link này với người khác</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Email này được gửi tự động từ hệ thống <span class="brand">Sachify</span>.</p>
            <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.</p>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    sendEmail,
    createPasswordResetEmail
}; 