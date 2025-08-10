const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'user_id',
    },
    storyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'story_id',
    },
}, {
    tableName: 'bookmarks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = Bookmark;
