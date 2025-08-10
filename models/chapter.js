const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chapter = sequelize.define('Chapter', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    storyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'story_id',
    },
    chapterNumber: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'chapter_number',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contentType: {
        type: DataTypes.ENUM('TEXT', 'IMAGES'),
        allowNull: false,
        field: 'content_type',
    },
    contentUrls: {
        type: DataTypes.TEXT,
        field: 'content_urls',
        // Getter và Setter để tự động xử lý JSON
        get() {
            const rawValue = this.getDataValue('contentUrls');
            // Nếu là mảng ảnh thì parse, nếu là text thì trả về chuỗi
            try {
                return JSON.parse(rawValue);
            } catch (e) {
                return rawValue;
            }
        },
        set(value) {
            // Nếu giá trị là một mảng (danh sách ảnh), chuyển thành chuỗi JSON
            if (Array.isArray(value)) {
                this.setDataValue('contentUrls', JSON.stringify(value));
            } else {
                this.setDataValue('contentUrls', value);
            }
        },
    },
}, {
    tableName: 'chapters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Chapter;