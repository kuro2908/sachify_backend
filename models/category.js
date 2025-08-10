const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
}, {
    tableName: 'categories',
    timestamps: false, // Bảng này không cần timestamps
});

module.exports = Category;