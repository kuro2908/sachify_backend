const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, createPasswordResetEmail } = require('../utils/email');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm tạo token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Hàm gửi response chuẩn hóa
const createSendToken = (user, statusCode, res) => {
    const token = generateToken(user.id, user.role);

    const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    res.status(statusCode).json({
        status: 'success',
        data: {
            user: userResponse,
            token
        }
    });
};

// Đăng ký bằng email và mật khẩu
exports.register = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        const error = new Error('Vui lòng cung cấp đầy đủ thông tin.');
        error.statusCode = 400;
        return next(error);
    }
    
    // Hook 'beforeSave' trong model User sẽ tự động mã hóa mật khẩu
    const newUser = await User.create({
        username,
        email,
        passwordHash: password,
    });

    createSendToken(newUser, 201, res);
});

// Đăng nhập bằng email/username và mật khẩu
exports.login = asyncHandler(async (req, res, next) => {
    const { email, username, password } = req.body;

    if (!password) {
        const error = new Error('Vui lòng cung cấp mật khẩu.');
        error.statusCode = 400;
        return next(error);
    }

    if (!email && !username) {
        const error = new Error('Vui lòng cung cấp email hoặc tên đăng nhập.');
        error.statusCode = 400;
        return next(error);
    }

    let user;
    
    // Tìm user bằng email hoặc username
    if (email) {
        user = await User.findOne({ where: { email } });
    } else {
        user = await User.findOne({ where: { username } });
    }

    if (!user || !(await user.comparePassword(password))) {
        const error = new Error('Email/tên đăng nhập hoặc mật khẩu không chính xác.');
        error.statusCode = 401;
        return next(error);
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.status === 'locked') {
        const error = new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.');
        error.statusCode = 403;
        return next(error);
        }

    // Kiểm tra tài khoản có bị khóa không
    if (user.status === 'locked') {
        const error = new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.');
        error.statusCode = 403;
        return next(error);
    }
    
    createSendToken(user, 200, res);
});

// Quên mật khẩu
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        const error = new Error('Vui lòng cung cấp email.');
        error.statusCode = 400;
        return next(error);
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const error = new Error('Không tìm thấy người dùng với email này.');
        error.statusCode = 404;
        return next(error);
    }

    // Tạo token reset ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Mã hóa token và lưu vào database
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Đặt thời gian hết hạn (10 phút)
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Lưu token đã mã hóa và thời gian hết hạn
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Tạo URL reset
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Tạo nội dung email
    const message = createPasswordResetEmail(resetURL, user.username);

    try {
        // Gửi email
        await sendEmail({
            email: user.email,
            subject: 'Đặt lại mật khẩu - Sachify',
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token đã được gửi đến email.'
        });
    } catch (error) {
        // Nếu gửi email thất bại, xóa token
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        const err = new Error('Không thể gửi email. Vui lòng thử lại sau.');
        err.statusCode = 500;
        return next(err);
    }
});

// Đặt lại mật khẩu
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
        const error = new Error('Vui lòng cung cấp mật khẩu và xác nhận mật khẩu.');
        error.statusCode = 400;
        return next(error);
    }

    if (password !== passwordConfirm) {
        const error = new Error('Mật khẩu và xác nhận mật khẩu không khớp.');
        error.statusCode = 400;
        return next(error);
    }

    // Mã hóa token để so sánh với database
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Tìm người dùng với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                [require('sequelize').Op.gt]: new Date()
            }
        }
    });

    if (!user) {
        const error = new Error('Token không hợp lệ hoặc đã hết hạn.');
        error.statusCode = 400;
        return next(error);
    }

    // Cập nhật mật khẩu mới
    user.passwordHash = password;
    
    // Xóa token reset
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    
    await user.save();

    // Tạo token JWT mới và gửi về
    createSendToken(user, 200, res);
});


// Đăng nhập / Đăng ký bằng Google
exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { credential } = req.body;
    if (!credential) {
        const error = new Error('Không tìm thấy credential của Google.');
        error.statusCode = 400;
        return next(error);
    }

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name: username } = payload;

    // Tìm người dùng bằng google_id
    let user = await User.findOne({ where: { googleId } });

    if (!user) {
        // Nếu không tìm thấy bằng google_id, thử tìm bằng email
        user = await User.findOne({ where: { email } });

        if (user) {
            // Nếu tìm thấy user có cùng email (đã đăng ký thường trước đó)
            // -> liên kết tài khoản bằng cách cập nhật google_id
            user.googleId = googleId;
            await user.save();
        } else {
            // Nếu không có tài khoản nào tồn tại -> tạo mới
            user = await User.create({
                googleId,
                email,
                username,
                // password_hash sẽ là NULL
            });
        }
    }
    
    createSendToken(user, 200, res);
});
