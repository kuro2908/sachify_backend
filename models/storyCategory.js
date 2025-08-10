const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoryCategory = sequelize.define('StoryCategory', {
    storyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'story_id',
    },
    categoryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'category_id',
    },
}, {
    tableName: 'story_categories',
    timestamps: false,
});

module.exports = StoryCategory;