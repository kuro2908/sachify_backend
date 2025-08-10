const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
    },
    chapterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'chapter_id',
    },
    parentCommentId: {
        type: DataTypes.INTEGER,
        field: 'parent_comment_id',
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Comment;