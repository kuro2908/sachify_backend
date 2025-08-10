const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFollow = sequelize.define('UserFollow', {
    followerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'follower_id',
    },
    followingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'following_id',
    },
}, {
    tableName: 'user_follows',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = UserFollow;