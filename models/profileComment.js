const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProfileComment = sequelize.define('ProfileComment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    profileUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'profile_user_id',
    },
    commenterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'commenter_id',
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
    tableName: 'profile_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ProfileComment;