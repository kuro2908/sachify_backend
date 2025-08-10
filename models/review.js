const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
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
    storyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'story_id',
    },
    rating: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    content: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Review;
