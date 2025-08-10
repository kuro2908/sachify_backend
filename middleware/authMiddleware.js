const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const error = new Error('Xác thực thất bại, không tìm thấy token.');
        error.statusCode = 401;
        return next(error);
    }

    try {
        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm người dùng trong DB bằng id từ token và gắn vào request
        // Loại bỏ trường passwordHash khỏi kết quả trả về
        req.user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!req.user) {
            const error = new Error('Người dùng thuộc về token này không còn tồn tại.');
            error.statusCode = 401;
            return next(error);
        }

        // Kiểm tra tài khoản có bị khóa không
        if (req.user.status === 'locked') {
            const error = new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.');
            error.statusCode = 403;
            return next(error);
        }

        next(); // Chuyển sang middleware hoặc controller tiếp theo
    } catch (error) {
        const err = new Error('Xác thực thất bại, token không hợp lệ.');
        err.statusCode = 401;
        return next(err);
    }
});

// Middleware kiểm tra vai trò (admin, manager, author, user)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const error = new Error(`Bạn không có quyền thực hiện hành động này.`);
            error.statusCode = 403; // 403 Forbidden
            return next(error);
        }
        next();
    };
};

// Middleware kiểm tra quyền admin hoặc manager
exports.authorizeAdminOrManager = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
        const error = new Error(`Bạn không có quyền thực hiện hành động này.`);
        error.statusCode = 403;
        return next(error);
    }
    next();
};
