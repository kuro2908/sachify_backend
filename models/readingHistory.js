const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReadingHistory = sequelize.define('ReadingHistory', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'user_id',
    },
    chapterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'chapter_id',
    },
    lastReadAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_read_at',
    },
}, {
    tableName: 'reading_history',
    timestamps: false, // last_read_at đã tự cập nhật
});

module.exports = ReadingHistory;