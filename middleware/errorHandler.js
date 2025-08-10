// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        user: req.user ? req.user.id : 'anonymous'
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new Error(message);
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new Error(message);
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new Error(message);
        error.statusCode = 400;
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(e => e.message).join(', ');
        error = new Error(message);
        error.statusCode = 400;
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Dữ liệu đã tồn tại trong hệ thống';
        error = new Error(message);
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token không hợp lệ';
        error = new Error(message);
        error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token đã hết hạn';
        error = new Error(message);
        error.statusCode = 401;
    }

    res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;