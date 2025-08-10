const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        field: 'google_id',
    },
    passwordHash: {
        type: DataTypes.STRING,
        field: 'password_hash',
    },
    role: {
        type: DataTypes.ENUM('user', 'author', 'admin'),
        allowNull: false,
        defaultValue: 'user',
    },
    status: {
        type: DataTypes.ENUM('active', 'locked'),
        allowNull: false,
        defaultValue: 'active',
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        field: 'password_reset_token',
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        field: 'password_reset_expires',
    },
    authorRequest: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'author_request',
    },
    authorRequestDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'author_request_date',
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        // Hook này sẽ tự động chạy trước khi một user mới được tạo hoặc cập nhật
        // Nó sẽ mã hóa mật khẩu nếu trường passwordHash được thay đổi
        beforeSave: async (user) => {
            if (user.changed('passwordHash') && user.passwordHash) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
            }
        },
    },
});

// THÊM PHƯƠNG THỨC NÀY VÀO
// Thêm một phương thức vào prototype của model User để so sánh mật khẩu
User.prototype.comparePassword = async function (candidatePassword) {
    // Tránh lỗi nếu user đăng nhập bằng Google và không có passwordHash
    if (!this.passwordHash) return false;
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = User;